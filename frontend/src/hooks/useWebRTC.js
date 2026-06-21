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
    }
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

  const setLocalStreamSynced = useCallback((stream) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
  }, []);

  const cleanup = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    const currentStream = localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
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
      existing.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices API not available. This might be due to an insecure context or unsupported browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { facingMode: { ideal: 'user' } } : false,
        audio: true
      });
      setLocalStreamSynced(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      if (isVideo) {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Media devices API not available.');
          }
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          });
          setLocalStreamSynced(audioOnlyStream);
          return audioOnlyStream;
        } catch (audioErr) {
          console.error('Error accessing audio:', audioErr);
          throw audioErr;
        }
      }
      throw err;
    }
  }, [setLocalStreamSynced]);

  const createPeerConnection = useCallback((targetId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    activeCallTargetId.current = targetId;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtcSignal', {
          targetId,
          type: 'ice-candidate',
          data: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [socket]);

  const addTracksToConnection = useCallback((stream) => {
    if (peerConnection.current && stream) {
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });
    }
  }, []);

  const createOffer = useCallback(async (targetId, callerData, currentStream = null) => {
    const pc = createPeerConnection(targetId);
    
    const streamToUse = currentStream || localStream;
    if (streamToUse) {
      addTracksToConnection(streamToUse);
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (socket) {
      socket.emit('webrtcSignal', {
        targetId,
        type: 'offer',
        data: offer,
        callerData
      });
    }
  }, [localStream, createPeerConnection, addTracksToConnection, socket]);

  const handleOffer = useCallback(async (offer, senderId, currentStream = null) => {
    const pc = createPeerConnection(senderId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    const buffered = iceCandidateBuffer.current.splice(0);
    for (const candidate of buffered) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        alert('[ICE] Failed to add buffered candidate:');
      }
    }
    
    const streamToUse = currentStream || localStream;
    if (streamToUse) {
      addTracksToConnection(streamToUse);
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (socket) {
      socket.emit('webrtcSignal', {
        targetId: senderId,
        type: 'answer',
        data: answer
      });
    }
  }, [localStream, createPeerConnection, addTracksToConnection, socket]);

  const handleAnswer = useCallback(async (answer) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      const buffered = iceCandidateBuffer.current.splice(0);
      for (const candidate of buffered) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[ICE] Failed to add buffered candidate:', e);
        }
      }
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate) => {
    if (peerConnection.current && peerConnection.current.remoteDescription) {
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
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);

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
    cleanup
  };
};
