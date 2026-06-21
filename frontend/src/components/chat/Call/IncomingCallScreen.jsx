
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../../contexts/CallContext';
import { useTheme } from '../../../contexts/ThemeContext';

const IncomingCallScreen = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  const { theme } = useTheme();

  if (!incomingCall) return null;

  const caller = incomingCall.callerData;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md">
      <div
        className="w-full sm:max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border"
        style={{
          backgroundColor: theme.background,
          borderColor: theme.isLight ? '#e2e8f0' : '#374151',
        }}
      >

        <div className="px-8 pt-8 pb-10 text-center">
          <div className="relative mx-auto w-24 h-24 mb-5">
            {caller?.avatar ? (
              <img
                src={caller.avatar}
                alt="Caller"
                className="w-full h-full object-cover rounded-full shadow-lg ring-4 ring-purple-500/30"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-purple-500/30">
                <span className="text-3xl text-white font-bold">
                  {caller?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <span className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-60 animate-ping" />
          </div>

          <h2 className="text-2xl font-semibold mb-1" style={{ color: theme.text }}>
            {caller?.username}
          </h2>
          <p className="text-sm mb-8 opacity-55" style={{ color: theme.text }}>
            Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call
          </p>

          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={rejectCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center text-white shadow-lg transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="text-xs opacity-50" style={{ color: theme.text }}>Decline</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={acceptCall}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 flex items-center justify-center text-white shadow-lg transition-colors"
              >
                {incomingCall.isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </button>
              <span className="text-xs opacity-50" style={{ color: theme.text }}>Accept</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallScreen;
