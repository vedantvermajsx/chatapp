import React, { useEffect, useRef } from 'react';
import { WifiOff, Minimize2, Maximize2 } from 'lucide-react';
import { useCall } from '../../../contexts/CallContext';
import CallControls from './CallControls';

const ActiveCallScreen = () => {
  const {
    activeCall,
    localStream,
    remoteStream,
    connectionState,
    isMinimized,
    toggleMinimize,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

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
    <div
      className={isMinimized
        ? "fixed bottom-6 right-6 z-[100] w-48 h-72 bg-gray-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col cursor-pointer border border-white/10 hover:border-white/20 transition-all hover:scale-105"
        : "fixed inset-0 z-[100] bg-gray-950 flex flex-col"
      }
      onClick={isMinimized ? toggleMinimize : undefined}
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
                      ? 'Video call connected'
                      : 'Audio call connected'}
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
        <div className="h-12 bg-gray-900 border-t border-white/5 flex flex-col justify-center px-4">
          <p className="text-white text-sm font-medium truncate">{target?.username}</p>
          <p className="text-white/50 text-xs truncate">
            {isConnecting ? 'Calling...' : isVideo ? 'Video Call' : 'Audio Call'}
          </p>
        </div>
      ) : (
        <CallControls isVideo={isVideo} />
      )}
    </div>
  );
};

export default ActiveCallScreen;
