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
  const [callConnectedTime, setCallConnectedTime] = useState(null);

  const toggleMinimize = useCallback(() => setIsMinimized((prev) => !prev), []);

  const callStartTimeRef = useRef(null);
  const callConnectedTimeRef = useRef(null);
  const ringtoneRef = useRef(null);
  const isAcceptingRef = useRef(false);

  useEffect(() => {
    ringtoneRef.current = new Audio(ringtoneAudio);
    ringtoneRef.current.loop = true;
  }, []);

  const playRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.play().catch((e) => console.warn('Ringtone play error:', e));
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, []);

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
  const rtcRef = useRef(rtc);

  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { rtcRef.current = rtc; }, [rtc]);

  const endCallLocally = useCallback(() => {
    rtc.cleanup();
    setIncomingCall(null);
    setActiveCall(null);
    setIsMinimized(false);
    isAcceptingRef.current = false;
    callConnectedTimeRef.current = null;
    setCallConnectedTime(null);
  }, [rtc]);

  useEffect(() => { endCallLocallyRef.current = endCallLocally; }, [endCallLocally]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeCallSnap = activeCallRef.current;
      rtc.localStreamRef?.current?.getTracks().forEach((t) => t.stop());
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
      const rtc = rtcRef.current;

      switch (type) {
        case 'offer': {
          if (activeCallSnap || incomingCallSnap) {
            socket.emit('webrtcSignal', { targetId: senderId, type: 'reject-call' });
            return;
          }
          setIncomingCall({ callerId: senderId, callerData, offer: data, isVideo: callerData?.isVideo });
          playRingtone();
          break;
        }

        case 'answer': {
          if (activeCallSnap && String(activeCallSnap.targetId) === String(senderId)) {
            await rtc.handleAnswer(data);
            const now = Date.now();
            callConnectedTimeRef.current = now;
            setCallConnectedTime(now);
            setActiveCall((prev) => ({ ...prev, status: 'connected' }));
            stopRingtone();
          }
          break;
        }

        case 'ice-candidate': {
          await rtc.handleIceCandidate(data);
          break;
        }

        case 'reject-call': {
          if (activeCallSnap && String(activeCallSnap.targetId) === String(senderId)) {
            if (activeCallSnap.status === 'calling' && activeCallSnap.targetData && callStartTimeRef.current) {
              const durationSecs = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
              const messageContent = `__SYSTEM_CALL__Missed ${activeCallSnap.isVideo ? 'Video' : 'Voice'} Call (Rang for ${durationSecs}s)`;
              import('../services/message.service').then((module) => {
                module.default.sendPrivateMessage({
                  receiverId: activeCallSnap.targetId.toString(),
                  receiverModel: activeCallSnap.targetData.role === 'guest' ? 'Guest' : 'User',
                  content: messageContent,
                  media: null,
                }).catch(console.error);
              });
            }
            stopRingtone();
            setCallError('Call was rejected');
            endCallLocallyRef.current?.();
          }
          break;
        }

        case 'end-call': {
          const isActiveCall = activeCallSnap && String(activeCallSnap.targetId) === String(senderId);
          const isIncomingCall = incomingCallSnap && String(incomingCallSnap.callerId) === String(senderId);

          if (isActiveCall || isIncomingCall) {
            if (isAcceptingRef.current) {
              isAcceptingRef.current = 'aborted';
            }
            callConnectedTimeRef.current = null;
            setCallConnectedTime(null);
            endCallLocallyRef.current?.();
          }
          stopRingtone();
          break;
        }

        default:
          break;
      }
    };

    socket.on('webrtcSignal', handleSignal);
    return () => socket.off('webrtcSignal', handleSignal);
  }, [socket, user, playRingtone, stopRingtone]);

  const startCall = useCallback(async (targetId, isVideo = false, targetData = null) => {
    try {
      setCallError(null);
      const stream = await rtc.initLocalStream(isVideo);
      callStartTimeRef.current = Date.now();
      setActiveCall({ targetId, isVideo, status: 'calling', targetData });
      await rtc.createOffer(
        targetId,
        { username: user.username, avatar: user.avatar, isVideo },
        stream
      );
    } catch (err) {
      console.error('[Call] startCall failed:', err);
      setCallError('Failed to access camera/microphone. Please allow permissions and try again.');
      endCallLocally();
    } finally {
      stopRingtone();
    }
  }, [rtc, user, endCallLocally, stopRingtone]);

  const acceptCall = useCallback(async () => {
    const incoming = incomingCallRef.current;
    if (!incoming || isAcceptingRef.current) return;

    isAcceptingRef.current = true;
    stopRingtone();

    let stream;
    try {
      stream = await rtc.initLocalStream(incoming.isVideo);
    } catch (err) {
      console.error('[Call] acceptCall — media access failed:', err);
      isAcceptingRef.current = false;
      setCallError('Failed to access camera/microphone. Please allow permissions and try again.');
      socket?.emit('webrtcSignal', { targetId: incoming.callerId, type: 'reject-call' });
      endCallLocally();
      return;
    }

    if (isAcceptingRef.current === 'aborted') {
      stream?.getTracks().forEach((t) => t.stop());
      isAcceptingRef.current = false;
      return;
    }

    try {
      const now = Date.now();
      callConnectedTimeRef.current = now;
      setCallConnectedTime(now);
      setActiveCall({
        targetId: incoming.callerId,
        isVideo: incoming.isVideo,
        status: 'connected',
        targetData: incoming.callerData,
      });
      setIncomingCall(null);
      await rtc.handleOffer(incoming.offer, incoming.callerId, stream);
    } catch (err) {
      console.error('[Call] acceptCall — handleOffer failed:', err);
      setCallError('Failed to connect call. Please try again.');
      socket?.emit('webrtcSignal', { targetId: incoming.callerId, type: 'reject-call' });
      endCallLocally();
    } finally {
      isAcceptingRef.current = false;
    }
  }, [rtc, socket, endCallLocally, stopRingtone]);

  const rejectCall = useCallback(() => {
    const incoming = incomingCallRef.current;
    if (incoming) {
      socket?.emit('webrtcSignal', { targetId: incoming.callerId, type: 'reject-call' });
    }
    stopRingtone();
    endCallLocally();
  }, [socket, endCallLocally, stopRingtone]);

  const endCall = useCallback(async () => {
    const activeCallSnap = activeCallRef.current;
    const targetId = activeCallSnap?.targetId;

    if (activeCallSnap?.status === 'calling' && activeCallSnap?.targetData && callStartTimeRef.current) {
      const durationSecs = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      const messageContent = `__SYSTEM_CALL__Missed ${activeCallSnap.isVideo ? 'Video' : 'Voice'} Call (Rang for ${durationSecs}s)`;
      import('../services/message.service').then((module) => {
        module.default.sendPrivateMessage({
          receiverId: targetId.toString(),
          receiverModel: activeCallSnap.targetData.role === 'guest' ? 'Guest' : 'User',
          content: messageContent,
          media: null,
        }).catch(console.error);
      });
    } else if (activeCallSnap?.status === 'connected' && callConnectedTimeRef.current && activeCallSnap?.targetData) {
      const duration = formatDuration(Date.now() - callConnectedTimeRef.current);
      const messageContent = `__SYSTEM_CALL__${activeCallSnap.isVideo ? 'Video' : 'Voice'} Call · ${duration}`;
      import('../services/message.service').then((module) => {
        module.default.sendPrivateMessage({
          receiverId: targetId.toString(),
          receiverModel: activeCallSnap.targetData.role === 'guest' ? 'Guest' : 'User',
          content: messageContent,
          media: null,
        }).catch(console.error);
      });
    }

    callStartTimeRef.current = null;
    if (targetId) {
      socket?.emit('webrtcSignal', { targetId, type: 'end-call' });
    }
    stopRingtone();
    endCallLocally();
  }, [socket, endCallLocally, stopRingtone]);

  return (
    <CallContext.Provider
      value={{
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
        callConnectedTime,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);