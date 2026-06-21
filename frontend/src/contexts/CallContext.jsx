import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAuth } from './AuthContext';
import ringtoneAudio from '../../assets/music.mp3';

const CallContext = createContext();

export const CallProvider = ({ children, socket }) => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callError, setCallError] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMinimize = () => setIsMinimized(prev => !prev);

  const callStartTimeRef = useRef(null);
  const callConnectedTimeRef = useRef(null);
  const ringtoneRef = useRef(null);

  useEffect(() => {
    ringtoneRef.current = new Audio(ringtoneAudio);
    ringtoneRef.current.loop = true;
  }, []);

  const playRingtone = () => {
    console.log("played");
    if (ringtoneRef.current) {
      console.log("playingg");
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.play().catch((e) => console.log('Audio play error:', e));
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const rtc = useWebRTC(socket);


  const incomingCallRef = useRef(null);
  const activeCallRef = useRef(null);
  const endCallLocallyRef = useRef(null);

  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

  const endCallLocally = useCallback(() => {
    rtc.cleanup();
    setIncomingCall(null);
    setActiveCall(null);
  }, [rtc]);

  useEffect(() => { endCallLocallyRef.current = endCallLocally; }, [endCallLocally]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeCallSnap = activeCallRef.current;
      const currentStream = rtc.localStreamRef?.current;

      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      if (socket && activeCallSnap?.targetId) {
        socket.emit('webrtcSignal', { targetId: activeCallSnap.targetId, type: 'end-call' });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [socket, rtc]);


  useEffect(() => {
    if (!socket || !user) return;

    const handleSignal = async (payload) => {
      const { type, senderId, data, callerData } = payload;
      const activeCallSnap = activeCallRef.current;
      const incomingCallSnap = incomingCallRef.current;

      console.log(`[WebRTC Signal Received] Type: ${type}, from: ${senderId}, targetId: ${activeCallSnap?.targetId || incomingCallSnap?.callerId}`);

      switch (type) {
        case 'offer':
          if (activeCallSnap || incomingCallSnap) {
            socket.emit('webrtcSignal', { targetId: senderId, type: 'reject-call' });
            return;
          }
          setIncomingCall({ callerId: senderId, callerData, offer: data, isVideo: callerData?.isVideo });
          playRingtone();
          break;
        case 'answer':
          console.log(`[WebRTC] Received answer from ${senderId}. activeCallSnap.targetId=${activeCallSnap?.targetId}`);
          if (activeCallSnap && String(activeCallSnap.targetId) === String(senderId)) {
            await rtc.handleAnswer(data);
            callConnectedTimeRef.current = Date.now();
            setActiveCall(prev => ({ ...prev, status: 'connected' }));
            stopRingtone();
          } else {
            console.log(`[WebRTC] Answer ignored. Mismatch or no active call.`);
          }
          break;
        case 'ice-candidate':
          await rtc.handleIceCandidate(data);
          break;
        case 'reject-call':
          if (activeCallSnap && activeCallSnap.targetId === senderId) {
            if (activeCallSnap.status === 'calling' && activeCallSnap.targetData && callStartTimeRef.current) {
              const durationSecs = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
              const messageContent = `__SYSTEM_CALL__Missed ${activeCallSnap.isVideo ? 'Video' : 'Voice'} Call (Rang for ${durationSecs}s)`;
              import('../services/message.service').then(module => {
                module.default.sendPrivateMessage({
                  receiverId: activeCallSnap.targetId.toString(),
                  receiverModel: activeCallSnap.targetData.role === 'guest' ? 'Guest' : 'User',
                  content: messageContent,
                  media: null
                }).catch(console.error);
              });
            }
            stopRingtone();
            setCallError('Call was rejected');
            endCallLocallyRef.current?.();
          }
          break;
        case 'end-call':
          if ((activeCallSnap && activeCallSnap.targetId === senderId) || (incomingCallSnap && incomingCallSnap.callerId === senderId)) {
            callConnectedTimeRef.current = null;
            endCallLocallyRef.current?.();
          }
          stopRingtone();
          break;
        default:
          break;
      }
    };

    socket.on('webrtcSignal', handleSignal);
    return () => {
      socket.off('webrtcSignal', handleSignal);
    };
  }, [socket, user, rtc]);

  const startCall = async (targetId, isVideo = false, targetData = null) => {
    try {
      setCallError(null);
      const stream = await rtc.initLocalStream(isVideo);
      callStartTimeRef.current = Date.now();
      setActiveCall({ targetId, isVideo, status: 'calling', targetData });
      await rtc.createOffer(targetId, {
        username: user.username,
        avatar: user.avatar,
        isVideo
      }, stream);
    } catch (err) {
      setCallError('Failed to access media devices');
      endCallLocally();
    } finally {
      stopRingtone();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await rtc.initLocalStream(incomingCall.isVideo);
      callConnectedTimeRef.current = Date.now();
      setActiveCall({ targetId: incomingCall.callerId, isVideo: incomingCall.isVideo, status: 'connected', targetData: incomingCall.callerData });
      await rtc.handleOffer(incomingCall.offer, incomingCall.callerId, stream);
      setIncomingCall(null);
    } catch (err) {
      setCallError('Failed to access media devices');
      rejectCall();
    } finally {
      stopRingtone();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('webrtcSignal', { targetId: incomingCall.callerId, type: 'reject-call' });
    }
    endCallLocally();
    stopRingtone();
  };

  const endCall = async () => {
    const targetId = activeCall?.targetId;

    if (activeCall?.status === 'calling' && activeCall?.targetData && callStartTimeRef.current) {
      const durationSecs = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      const messageContent = `__SYSTEM_CALL__Missed ${activeCall.isVideo ? 'Video' : 'Voice'} Call (Rang for ${durationSecs}s)`;
      try {
        import('../services/message.service').then(module => {
          module.default.sendPrivateMessage({
            receiverId: targetId.toString(),
            receiverModel: activeCall.targetData.role === 'guest' ? 'Guest' : 'User',
            content: messageContent,
            media: null
          }).catch(console.error);
        });
      } catch (err) {
        console.error('Failed to send missed call message', err);
      }
    } else if (activeCall?.status === 'connected' && callConnectedTimeRef.current && activeCall?.targetData) {
      const duration = formatDuration(Date.now() - callConnectedTimeRef.current);
      const messageContent = `__SYSTEM_CALL__${activeCall.isVideo ? 'Video' : 'Voice'} Call · ${duration}`;
      try {
        import('../services/message.service').then(module => {
          module.default.sendPrivateMessage({
            receiverId: targetId.toString(),
            receiverModel: activeCall.targetData.role === 'guest' ? 'Guest' : 'User',
            content: messageContent,
            media: null
          }).catch(console.error);
        });
      } catch (err) {
        console.error('Failed to send call duration message', err);
      } finally {
        stopRingtone();
      }
    }

    callConnectedTimeRef.current = null;
    if (targetId) {
      socket.emit('webrtcSignal', { targetId, type: 'end-call' });
    }
    stopRingtone();
    endCallLocally();
  };

  return (
    <CallContext.Provider value={{
      incomingCall,
      activeCall,
      callError,
      connectionState: rtc.connectionState,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      isMinimized,
      toggleMinimize,
      localStream: rtc.localStream,
      remoteStream: rtc.remoteStream,
      isMuted: rtc.isMuted,
      isVideoOff: rtc.isVideoOff,
      toggleMute: rtc.toggleMute,
      toggleVideo: rtc.toggleVideo,
      setCallError,
      callConnectedTime: callConnectedTimeRef.current
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
