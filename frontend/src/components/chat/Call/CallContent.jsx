import { WifiOff } from 'lucide-react';

const CallContent = ({
  isVideo,
  isConnecting,
  isMinimized,
  isLost,
  remoteStream,
  localStream,
  remoteVideoRef,
  localVideoRef,
  target,
  durationStr,
}) => (
  <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
    <video
      ref={remoteVideoRef}
      autoPlay
      playsInline
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
        isVideo && remoteStream && !isConnecting ? 'opacity-100' : 'opacity-0'
      }`}
    />

    {(!isVideo || isConnecting || !remoteStream) && (
      <div
        className={
          isMinimized
            ? 'absolute inset-0 flex flex-col items-center justify-center bg-gray-900'
            : 'relative z-10 flex flex-col items-center justify-center gap-5 px-6 text-center'
        }
      >
        {!isMinimized && <div className="absolute w-64 h-64 rounded-full bg-indigo-600/15 blur-3xl -z-10" />}

        {target?.avatar ? (
          <img
            src={target.avatar}
            alt={target.username}
            className={
              isMinimized
                ? 'w-16 h-16 rounded-full object-cover shadow-lg'
                : `w-28 h-28 rounded-full object-cover shadow-2xl ring-4 ring-white/10 ${isConnecting ? 'animate-pulse' : ''}`
            }
          />
        ) : (
          <div
            className={
              isMinimized
                ? 'w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg'
                : `w-28 h-28 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-2xl ring-4 ring-white/10 ${isConnecting ? 'animate-pulse' : ''}`
            }
          >
            <span className={isMinimized ? 'text-2xl text-white font-semibold' : 'text-5xl text-white font-semibold'}>
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
      <div
        className={
          isMinimized
            ? 'absolute bottom-2 right-2 w-14 h-20 rounded-lg overflow-hidden shadow-lg border border-white/20 z-20'
            : 'absolute bottom-28 right-4 w-28 h-44 sm:w-36 sm:h-52 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20 z-20'
        }
      >
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
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
);

export default CallContent;
