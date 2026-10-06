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
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [canSwitchSpeaker, setCanSwitchSpeaker] = useState(false);
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);
  const [canShareScreen] = useState(
    () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia
  );

  const peerConnection = useRef(null);
  const activeCallTargetId = useRef(null);
  const iceCandidateBuffer = useRef([]);
  const localStreamRef = useRef(null);
  const remoteElRef = useRef(null);
  const outputDevicesRef = useRef([]);
  const facingModeRef = useRef('user');
  const screenStreamRef = useRef(null);
  const screenSenderRef = useRef(null);
  const mainRemoteStreamIdRef = useRef(null);
  const isPoliteRef = useRef(false);

  const socketRef = useRef(socket);
  socketRef.current = socket;

  const setRemoteMediaElement = useCallback((el) => {
    remoteElRef.current = el;
  }, []);

  const detectDeviceCapabilities = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((d) => d.kind === 'audiooutput');
      const inputs = devices.filter((d) => d.kind === 'videoinput');
      outputDevicesRef.current = outputs;
      setCanSwitchSpeaker(typeof HTMLMediaElement !== 'undefined' && !!HTMLMediaElement.prototype.setSinkId && outputs.length > 1);
      setCanSwitchCamera(inputs.length > 1);
    } catch (err) {
      console.warn('[WebRTC] enumerateDevices failed:', err);
    }
  }, []);

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
    screenStreamRef.current?.getTracks().forEach((t) => { t.onended = null; t.stop(); });
    screenStreamRef.current = null;
    screenSenderRef.current = null;
    mainRemoteStreamIdRef.current = null;
    setIsScreenSharing(false);
    setRemoteScreenStream(null);
    setRemoteStream(null);
    activeCallTargetId.current = null;
    iceCandidateBuffer.current = [];
    setConnectionState('new');
    setIsMuted(false);
    setIsVideoOff(false);
    setIsSpeakerOn(false);
    setCanSwitchSpeaker(false);
    setCanSwitchCamera(false);
    facingModeRef.current = 'user';
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
      facingModeRef.current = 'user';
      setLocalStreamSynced(stream);
      detectDeviceCapabilities();
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
          detectDeviceCapabilities();
          return audioStream;
        } catch (audioErr) {
          console.error('[WebRTC] Audio access also failed:', audioErr);
          throw audioErr;
        }
      }
      console.error('[WebRTC] Media access failed:', err);
      throw err;
    }
  }, [setLocalStreamSynced, detectDeviceCapabilities]);

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
    mainRemoteStreamIdRef.current = null;
    setRemoteScreenStream(null);

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
      const stream = event.streams?.[0];
      if (!stream) return;
      if (!mainRemoteStreamIdRef.current || mainRemoteStreamIdRef.current === stream.id) {
        mainRemoteStreamIdRef.current = stream.id;
        setRemoteStream(stream);
      } else {
        setRemoteScreenStream(stream);
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
    isPoliteRef.current = false;
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
    isPoliteRef.current = true;
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

  const toggleSpeaker = useCallback(async () => {
    const el = remoteElRef.current;
    const outputs = outputDevicesRef.current;
    if (!el?.setSinkId || outputs.length < 2) return;

    setIsSpeakerOn((prev) => {
      const next = !prev;
      const target = next
        ? outputs.find((d) => /speaker/i.test(d.label)) || outputs.find((d) => d.deviceId !== 'default') || outputs[0]
        : outputs.find((d) => d.deviceId === 'default') || outputs[0];

      el.setSinkId(target.deviceId).catch((err) => console.warn('[WebRTC] setSinkId failed:', err));
      return next;
    });
  }, []);

  const switchCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    const oldTrack = stream?.getVideoTracks()[0];
    if (!stream || !oldTrack || !navigator.mediaDevices?.getUserMedia) return;

    const nextFacing = facingModeRef.current === 'user' ? 'environment' : 'user';

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: nextFacing } },
        audio: false,
      });
      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) return;

      const sender = peerConnection.current?.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newTrack);
      }

      stream.removeTrack(oldTrack);
      stream.addTrack(newTrack);
      oldTrack.stop();

      facingModeRef.current = nextFacing;
    } catch (err) {
      console.warn('[WebRTC] switchCamera failed:', err);
    }
  }, []);

  const renegotiate = useCallback(async () => {
    const pc = peerConnection.current;
    const targetId = activeCallTargetId.current;
    if (!pc || !targetId || pc.signalingState !== 'stable') return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('webrtcSignal', { targetId, type: 'renegotiate-offer', data: pc.localDescription });
  }, []);

  const handleRenegotiateOffer = useCallback(async (offer, senderId) => {
    const pc = peerConnection.current;
    if (!pc) return;
    if (pc.signalingState !== 'stable') {
      if (!isPoliteRef.current) return;
      await pc.setLocalDescription({ type: 'rollback' });
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current?.emit('webrtcSignal', { targetId: senderId, type: 'renegotiate-answer', data: pc.localDescription });
  }, []);

  const handleRenegotiateAnswer = useCallback(async (answer) => {
    const pc = peerConnection.current;
    if (!pc || pc.signalingState !== 'have-local-offer') return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (e) {
      console.warn('[WebRTC] renegotiate answer failed:', e);
    }
  }, []);

  const handleRemoteScreenState = useCallback((active) => {
    if (!active) setRemoteScreenStream(null);
  }, []);

  const stopScreenShare = useCallback(async () => {
    const stream = screenStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((t) => { t.onended = null; t.stop(); });
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    const pc = peerConnection.current;
    const sender = screenSenderRef.current;
    screenSenderRef.current = null;
    if (pc && sender) {
      try { pc.removeTrack(sender); } catch (e) { console.warn('[WebRTC] removeTrack failed:', e); }
      await renegotiate().catch((e) => console.warn('[WebRTC] renegotiate failed:', e));
    }
    const targetId = activeCallTargetId.current;
    if (targetId) socketRef.current?.emit('webrtcSignal', { targetId, type: 'screen-share', data: { active: false } });
  }, [renegotiate]);

  const startScreenShare = useCallback(async () => {
    const pc = peerConnection.current;
    if (!pc || screenStreamRef.current || !navigator.mediaDevices?.getDisplayMedia) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      track.onended = () => stopScreenShare();
      screenStreamRef.current = stream;
      screenSenderRef.current = pc.addTrack(track, stream);
      setIsScreenSharing(true);
      const targetId = activeCallTargetId.current;
      socketRef.current?.emit('webrtcSignal', { targetId, type: 'screen-share', data: { active: true } });
      await renegotiate();
    } catch (err) {
      if (err?.name !== 'NotAllowedError') console.warn('[WebRTC] startScreenShare failed:', err);
    }
  }, [renegotiate, stopScreenShare]);

  const toggleScreenShare = useCallback(
    () => (screenStreamRef.current ? stopScreenShare() : startScreenShare()),
    [startScreenShare, stopScreenShare]
  );

  return {
    localStream,
    localStreamRef,
    remoteStream,
    connectionState,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    canSwitchSpeaker,
    canSwitchCamera,
    setRemoteMediaElement,
    initLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    switchCamera,
    isScreenSharing,
    canShareScreen,
    remoteScreenStream,
    toggleScreenShare,
    handleRenegotiateOffer,
    handleRenegotiateAnswer,
    handleRemoteScreenState,
    cleanup,
  };
};