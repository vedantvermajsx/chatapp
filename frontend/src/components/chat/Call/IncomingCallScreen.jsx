import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../../contexts/CallContext';
import { useTheme } from '../../../contexts/ThemeContext';

const IncomingCallScreen = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  const { theme } = useTheme();

  const temp = 'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1782369805/male_g68rxt.avif';

  if (!incomingCall) return null;

  const caller = incomingCall.callerData;
  const isLight = !!theme?.isLight;

  const primaryText = isLight ? '#16151f' : '#f5f3ff';
  const secondaryText = isLight ? '#52525b' : '#c4b5fd';
  const cardBg = isLight
    ? 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)'
    : 'linear-gradient(180deg, #221f33 0%, #14121f 100%)';
  const borderColor = isLight ? 'rgba(99,102,241,0.15)' : 'rgba(168,85,247,0.20)';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xl">
      <div
        className="relative w-full sm:max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border"
        style={{ background: cardBg, borderColor }}
      >
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }}
        />

        <div className="relative px-8 pt-10 pb-10 text-center">
          <div className="relative mx-auto w-28 h-28 mb-6">
            <div
              className="absolute -inset-1.5 rounded-full animate-spin-slow"
              style={{ background: 'conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #6366f1)' }}
            />
            <div className="absolute inset-0 rounded-full" style={{ backgroundColor: theme?.background }} />
            <div className="absolute inset-[3px] rounded-full overflow-hidden shadow-xl bg-gray-200">
              <img
                src={caller?.avatar?.replace('w_50,h_50,c_fill', 'w_100,h_100,c_fill') || temp}
                alt="Caller"
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover"
              />
              )
            </div>
            <span className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-50 animate-ping" />
          </div>

          <h2 className="text-2xl font-bold mb-1.5 tracking-tight" style={{ color: primaryText }}>
            {caller?.username}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mb-9">
            <p className="text-sm font-semibold" style={{ color: secondaryText }}>
              Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call
            </p>
          </div>

          <div className="flex justify-center gap-10">
            <div className="flex flex-col items-center gap-2.5">
              <button
                onClick={rejectCall}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-95 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all duration-150"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="text-xs font-semibold" style={{ color: secondaryText }}>Decline</span>
            </div>

            <div className="flex flex-col items-center gap-2.5">
              <button
                onClick={acceptCall}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-500 hover:to-green-700 active:scale-95 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 transition-all duration-150 animate-pulse-slow"
              >
                {incomingCall.isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </button>
              <span className="text-xs font-semibold" style={{ color: secondaryText }}>Accept</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); } 100% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }}
        .animate-pulse-slow { animation: pulse-slow 1.8s forwards infinite; }
      `}</style>
    </div>
  );
};

export default IncomingCallScreen;