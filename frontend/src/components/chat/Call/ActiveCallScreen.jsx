import { useState, useEffect, useRef } from 'react';
import { Minimize2 } from 'lucide-react';
import { useCall } from '../../../contexts/CallContext';
import CallControls from './CallControls';
import CallContent from './CallContent';
import MinimizedView from './MinimizedView';

const ActiveCallScreen = () => {
  const {
    activeCall,
    localStream,
    remoteStream,
    connectionState,
    isMinimized,
    toggleMinimize,
    endCall,
    isMuted,
    toggleMute,
    callConnectedTime,
    setRemoteMediaElement,
    remoteScreenStream,
    isScreenSharing,
  } = useCall();

  const [durationStr, setDurationStr] = useState('00:00:00');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteScreenRef = useRef(null);

  useEffect(() => {
    if (!callConnectedTime || connectionState !== 'connected') {
      setDurationStr('00:00:00');
      return;
    }
    const tick = () => {
      const secs = Math.floor((Date.now() - callConnectedTime) / 1000);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setDurationStr(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [callConnectedTime, connectionState]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((e) => console.warn('Local play error:', e));
    }
  }, [localStream, isMinimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((e) => console.warn('Remote play error:', e));
      setRemoteMediaElement(remoteVideoRef.current);
    }
  }, [remoteStream, isMinimized, setRemoteMediaElement]);

  useEffect(() => {
    if (remoteScreenRef.current) {
      remoteScreenRef.current.srcObject = remoteScreenStream || null;
      if (remoteScreenStream) remoteScreenRef.current.play().catch((e) => console.warn('Screen play error:', e));
    }
  }, [remoteScreenStream, isMinimized]);

  if (!activeCall) return null;

  const isVideo = activeCall.isVideo;
  const isConnecting = activeCall.status === 'calling';
  const isLost = connectionState === 'disconnected' || connectionState === 'failed';
  const target = activeCall.targetData;

  const sharedProps = {
    isVideo,
    isConnecting,
    isLost,
    remoteStream,
    localStream,
    remoteVideoRef,
    localVideoRef,
    target,
    durationStr,
    remoteScreenStream,
    remoteScreenRef,
    isScreenSharing,
  };

  if (isMinimized) {
    return (
      <MinimizedView
        {...sharedProps}
        isMuted={isMuted}
        toggleMute={toggleMute}
        endCall={endCall}
        toggleMinimize={toggleMinimize}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col">
      <button
        onClick={toggleMinimize}
        className="absolute top-6 left-6 z-30 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all"
        title="Minimize call"
      >
        <Minimize2 className="w-6 h-6" />
      </button>

      <CallContent {...sharedProps} isMinimized={false} />
      <CallControls isVideo={isVideo} />
    </div>
  );
};

export default ActiveCallScreen;