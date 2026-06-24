import { useState, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

export const useWebRTC = (socket) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionState, setConnectionState] = useState('new');

  const peerConnection = useRef(null);
  const activeCallTargetId = useRef(null);
  const iceCandidateBuffer = useRef([]);
  const localStreamRef = useRef(null);

  const socketRef = useRef(socket);
  socketRef.current = socket;

  const setLocalStreamSynced = useCallback((stream) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
  }, []);

  const cleanup = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.onicecandidate = null;
      peerConnection.current.onconnectionstatechange = null;
      peerConnection.current.ontrack = null;
      peerConnection.current.close();
      peerConnection.current = null;
    }
    const currentStream = localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    setRemoteStream(null);
    activeCallTargetId.current = null;
    iceCandidateBuffer.current = [];
    setConnectionState('new');
    setIsMuted(false);
    setIsVideoOff(false);
  }, []);

  const initLocalStream = useCallback(async (isVideo = false) => {
    const existing = localStreamRef.current;
    if (existing) {
      existing.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Media devices API not available. Use HTTPS or check browser support.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { facingMode: { ideal: 'user' } } : false,
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      setLocalStreamSynced(stream);
      return stream;
    } catch (err) {
      if (isVideo) {
        console.warn('[WebRTC] Video access failed, falling back to audio:', err);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          setLocalStreamSynced(audioStream);
          return audioStream;
        } catch (audioErr) {
          console.error('[WebRTC] Audio access also failed:', audioErr);
          throw audioErr;
        }
      }
      console.error('[WebRTC] Media access failed:', err);
      throw err;
    }
  }, [setLocalStreamSynced]);

  const createPeerConnection = useCallback((targetId) => {
    if (peerConnection.current) {
      peerConnection.current.onicecandidate = null;
      peerConnection.current.onconnectionstatechange = null;
      peerConnection.current.ontrack = null;
      peerConnection.current.close();
      peerConnection.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    activeCallTargetId.current = targetId;

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtcSignal', {
          targetId,
          type: 'ice-candidate',
          data: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.warn('[WebRTC] Connection failed, attempting ICE restart...');
        pc.restartIce?.();
      }
    };

    pc.ontrack = (event) => {
      if (event.streams?.[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnection.current = pc;
    return pc;
  }, []);

  const addTracksToConnection = useCallback((stream) => {
    if (!peerConnection.current || !stream) return;
    const existingSenders = peerConnection.current.getSenders();
    stream.getTracks().forEach((track) => {
      const alreadyAdded = existingSenders.some((s) => s.track === track);
      if (!alreadyAdded) {
        peerConnection.current.addTrack(track, stream);
      }
    });
  }, []);

  const createOffer = useCallback(async (targetId, callerData, currentStream = null) => {
    const pc = createPeerConnection(targetId);
    const streamToUse = currentStream || localStreamRef.current;
    if (streamToUse) addTracksToConnection(streamToUse);

    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);

    if (socketRef.current) {
      socketRef.current.emit('webrtcSignal', { targetId, type: 'offer', data: offer, callerData });
    }
  }, [createPeerConnection, addTracksToConnection]);

  const handleOffer = useCallback(async (offer, senderId, currentStream = null) => {
    const pc = createPeerConnection(senderId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const buffered = iceCandidateBuffer.current.splice(0);
    for (const candidate of buffered) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[ICE] Failed to add buffered candidate:', e);
      }
    }

    const streamToUse = currentStream || localStreamRef.current;
    if (streamToUse) addTracksToConnection(streamToUse);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (socketRef.current) {
      socketRef.current.emit('webrtcSignal', { targetId: senderId, type: 'answer', data: answer });
    }
  }, [createPeerConnection, addTracksToConnection]);

  const handleAnswer = useCallback(async (answer) => {
    if (!peerConnection.current) return;
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      const buffered = iceCandidateBuffer.current.splice(0);
      for (const candidate of buffered) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[ICE] Failed to add buffered candidate after answer:', e);
        }
      }
    } catch (e) {
      console.error('[WebRTC] handleAnswer failed:', e);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate) => {
    if (peerConnection.current?.remoteDescription) {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[ICE] Failed to add candidate:', e);
      }
    } else {
      iceCandidateBuffer.current.push(candidate);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  }, []);

  return {
    localStream,
    localStreamRef,
    remoteStream,
    connectionState,
    isMuted,
    isVideoOff,
    initLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    toggleMute,
    toggleVideo,
    cleanup,
  };
};