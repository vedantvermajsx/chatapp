import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useCall } from '../../../contexts/CallContext';

const CallControls = ({ isVideo }) => {
  const { endCall, isMuted, isVideoOff, toggleMute, toggleVideo } = useCall();

  return (
    <div className="h-24 bg-gray-950/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-5 px-6 absolute bottom-0 w-full">
      <button
        onClick={toggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
        className={`w-13 h-13 w-12 h-12 rounded-full flex items-center justify-center transition-colors text-sm font-medium
          ${isMuted
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/35 active:bg-red-500/50 ring-1 ring-red-500/40'
            : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30'
          }`}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      <button
        onClick={endCall}
        title="End call"
        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center text-white shadow-xl transition-colors"
      >
        <PhoneOff className="w-7 h-7" />
      </button>

      {isVideo ? (
        <button
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn video on' : 'Turn video off'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
            ${isVideoOff
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/35 active:bg-red-500/50 ring-1 ring-red-500/40'
              : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30'
            }`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>
      ) : (
        <div className="w-12 h-12" />
      )}
    </div>
  );
};

export default CallControls;
