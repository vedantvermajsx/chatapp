import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Volume1, SwitchCamera, ScreenShare, ScreenShareOff } from 'lucide-react';
import { useCall } from '../../../contexts/CallContext';

const TONES = {
  neutral: 'bg-white/10 text-white hover:bg-white/20 active:bg-white/25',
  danger: 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40 hover:bg-red-500/30 active:bg-red-500/40',
  info: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40 hover:bg-blue-500/30 active:bg-blue-500/40',
  success: 'bg-green-500/20 text-green-300 ring-1 ring-green-500/40 hover:bg-green-500/30 active:bg-green-500/40',
};

const ControlButton = ({ label, onClick, tone = 'neutral', disabled = false, pressed, children }) => (
  <div className="flex flex-col items-center gap-1.5 min-w-[3.5rem]">
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70
        ${disabled ? 'bg-white/5 text-white/30 cursor-not-allowed' : TONES[tone]}`}
    >
      {children}
    </button>
    <span className={`text-[11px] leading-none font-medium ${disabled ? 'text-white/25' : 'text-white/60'}`}>{label}</span>
  </div>
);

const CallControls = ({ isVideo }) => {
  const {
    endCall,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    canSwitchSpeaker,
    canSwitchCamera,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    switchCamera,
    isScreenSharing,
    canShareScreen,
    toggleScreenShare,
  } = useCall();

  const icon = 'w-5 h-5 sm:w-6 sm:h-6';

  return (
    <div
      className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto w-fit max-w-[calc(100%-1rem)] flex items-start justify-center flex-wrap gap-x-3 gap-y-3 sm:gap-x-5 px-4 py-3 rounded-3xl bg-gray-900/80 backdrop-blur-md border border-white/10 shadow-2xl">
        {canSwitchSpeaker && (
          <ControlButton
            label={isSpeakerOn ? 'Speaker' : 'Earpiece'}
            pressed={isSpeakerOn}
            tone={isSpeakerOn ? 'info' : 'neutral'}
            onClick={toggleSpeaker}
          >
            {isSpeakerOn ? <Volume2 className={icon} /> : <Volume1 className={icon} />}
          </ControlButton>
        )}

        <ControlButton
          label={isMuted ? 'Unmute' : 'Mute'}
          pressed={isMuted}
          tone={isMuted ? 'danger' : 'neutral'}
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className={icon} /> : <Mic className={icon} />}
        </ControlButton>

        {isVideo && (
          <ControlButton
            label={isVideoOff ? 'Start video' : 'Stop video'}
            pressed={isVideoOff}
            tone={isVideoOff ? 'danger' : 'neutral'}
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className={icon} /> : <Video className={icon} />}
          </ControlButton>
        )}

        {isVideo && canSwitchCamera && (
          <ControlButton label="Flip" disabled={isVideoOff} onClick={switchCamera}>
            <SwitchCamera className={icon} />
          </ControlButton>
        )}

        {canShareScreen && (
          <ControlButton
            label={isScreenSharing ? 'Stop share' : 'Share'}
            pressed={isScreenSharing}
            tone={isScreenSharing ? 'success' : 'neutral'}
            onClick={toggleScreenShare}
          >
            {isScreenSharing ? <ScreenShareOff className={icon} /> : <ScreenShare className={icon} />}
          </ControlButton>
        )}

        <div className="flex flex-col items-center gap-1.5 min-w-[3.5rem]">
          <button
            type="button"
            onClick={endCall}
            title="End call"
            aria-label="End call"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 active:scale-95 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <PhoneOff className={icon} />
          </button>
          <span className="text-[11px] leading-none font-medium text-white/60">End</span>
        </div>
      </div>
    </div>
  );
};

export default CallControls;
