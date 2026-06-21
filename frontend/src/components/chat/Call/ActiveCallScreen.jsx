import { useState, useEffect, useRef } from 'react';
import { WifiOff, Minimize2, Maximize2, Mic, MicOff, PhoneOff } from 'lucide-react';
import { useCall } from '../../../contexts/CallContext';
import { motion } from 'framer-motion';
import CallControls from './CallControls';

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
  } = useCall();

  const [durationStr, setDurationStr] = useState('00:00:00');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    let interval;
    if (callConnectedTime && connectionState === 'connected') {
      const updateTime = () => {
        const seconds = Math.floor((Date.now() - callConnectedTime) / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        setDurationStr(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      };
      updateTime();
      interval = setInterval(updateTime, 1000);
    } else {
      setDurationStr('00:00:00');
    }
    return () => clearInterval(interval);
  }, [callConnectedTime, connectionState]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(e => console.warn('Local play error:', e));
    }
  }, [localStream, isMinimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(e => console.warn('Remote play error:', e));
    }
  }, [remoteStream, isMinimized]);

  if (!activeCall) return null;

  const isVideo = activeCall.isVideo;
  const isConnecting = activeCall.status === 'calling';
  const isLost = connectionState === 'disconnected' || connectionState === 'failed';
  const target = activeCall.targetData;

  return (
    <motion.div
      drag={isMinimized}
      dragMomentum={false}
      className={isMinimized
        ? "fixed bottom-6 right-6 z-[100] w-[153px] h-[230px] sm:w-48 sm:h-72 bg-gray-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col cursor-pointer border border-white/10 hover:border-white/20 transition-all hover:scale-105"
        : "fixed inset-0 z-[100] bg-gray-950 flex flex-col"
      }
      onDoubleClick={toggleMinimize}
    >
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">

        {isMinimized && (
          <div className="absolute top-2 right-2 z-30 p-1 bg-black/50 rounded-full text-white/70 hover:text-white backdrop-blur-md">
            <Maximize2 className="w-4 h-4" />
          </div>
        )}

        {!isMinimized && (
          <button
            onClick={toggleMinimize}
            className="absolute top-6 left-6 z-30 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-all"
            title="Minimize call"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        )}

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isVideo && remoteStream && !isConnecting ? 'opacity-100' : 'opacity-0'}`}
        />

        {(!isVideo || isConnecting || !remoteStream) && (
          <div className={isMinimized
            ? "absolute inset-0 flex flex-col items-center justify-center bg-gray-900"
            : "relative z-10 flex flex-col items-center justify-center gap-5 px-6 text-center"
          }>
            {!isMinimized && <div className="absolute w-64 h-64 rounded-full bg-indigo-600/15 blur-3xl -z-10" />}

            {target?.avatar ? (
              <img
                src={target.avatar}
                alt={target.username}
                className={isMinimized
                  ? "w-16 h-16 rounded-full object-cover shadow-lg"
                  : `w-28 h-28 rounded-full object-cover shadow-2xl ring-4 ring-white/10 ${isConnecting ? 'animate-pulse' : ''}`
                }
              />
            ) : (
              <div
                className={isMinimized
                  ? "w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg"
                  : `w-28 h-28 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-2xl ring-4 ring-white/10 ${isConnecting ? 'animate-pulse' : ''}`
                }
              >
                <span className={isMinimized ? "text-2xl text-white font-semibold" : "text-5xl text-white font-semibold"}>
                  {target?.username ? target.username.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            )}

            {!isMinimized && (
              <div>
                <p className="text-white text-xl font-medium">{target?.username}</p>
                <p className="text-white/45 text-sm mt-1">
                  {isConnecting
                    ? 'Calling…'
                    : isVideo
                      ? `Video call · ${durationStr}`
                      : `Audio call · ${durationStr}`}
                </p>
              </div>
            )}
          </div>
        )}

        {isVideo && localStream && (
          <div className={isMinimized
            ? "absolute bottom-2 right-2 w-14 h-20 rounded-lg overflow-hidden shadow-lg border border-white/20 z-20"
            : "absolute bottom-28 right-4 w-28 h-44 sm:w-36 sm:h-52 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20 z-20"
          }>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"

            />
            {!isMinimized && <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />}
          </div>
        )}

        {!isMinimized && isLost && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white px-5 py-2 rounded-full shadow-2xl text-xs font-semibold tracking-wide uppercase animate-pulse">
            <WifiOff className="w-3.5 h-3.5" />
            Connection Lost
          </div>
        )}

      </div>

      {isMinimized ? (
        <div className="h-14 bg-gray-900 border-t border-white/5 flex items-center justify-between px-4">
          <div className="flex flex-col justify-center max-w-[50%] overflow-hidden pointer-events-none">
            <p className="text-white text-sm font-medium truncate">{target?.username}</p>
            <p className="text-white/50 text-xs truncate">
              {isConnecting ? 'Calling...' : isVideo ? `Video Call · ${durationStr}` : `Audio Call · ${durationStr}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                ${isMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/35'
                  : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); endCall(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <CallControls isVideo={isVideo} />
      )}
    </motion.div>
  );
};

export default ActiveCallScreen;
