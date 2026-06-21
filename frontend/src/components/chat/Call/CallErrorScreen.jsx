import React from 'react';
import { PhoneOff } from 'lucide-react';
import { useCall } from '../../../contexts/CallContext';
import { useTheme } from '../../../contexts/ThemeContext';

const CallErrorScreen = () => {
  const { callError, setCallError } = useCall();
  const { theme } = useTheme();

  if (!callError) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div
        className="p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border"
        style={{
          backgroundColor: theme.background,
          borderColor: theme.isLight ? '#fecaca' : '#7f1d1d',
        }}
      >
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <PhoneOff className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
          Call Failed
        </h3>
        <p className="mb-7 text-sm opacity-65" style={{ color: theme.text }}>
          {callError}
        </p>
        <button
          onClick={() => setCallError(null)}
          className="w-full py-3 rounded-xl font-medium text-sm bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default CallErrorScreen;
