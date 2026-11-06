import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../../contexts/ThemeContext';
import { THEMES } from '../../../contexts/THEMES';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const ThemePicker = ({ show, onClose }) => {
  const { theme, setTheme, chatBackground, setChatBackgroundImage, clearChatBackgroundImage } = useTheme();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handlePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      await setChatBackgroundImage(file);
    } catch (err) {
      toast.error(err.message || 'Could not set chat background');
    } finally {
      setBusy(false);
    }
  };
  const { getShadow, getNeumorphicProps } = useNeumorphism();

  if (!show) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 p-4 md:p-6 rounded-2xl z-50 w-80 max-h-[70vh] overflow-y-auto custom-scrollbar" style={{
      backgroundColor: theme.background,
      boxShadow: getShadow(theme.isLight, false, 1, 0)
    }}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold" style={{ color: theme.otherMessageText }}>Select Theme</h3>
      </div>
      <div className="mb-4 p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: theme.otherMessageBubble }}>
        <div
          className="w-12 h-12 rounded-lg flex-shrink-0 bg-cover bg-center"
          style={{
            backgroundColor: theme.background,
            backgroundImage: chatBackground ? `url(${chatBackground})` : undefined,
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: theme.otherMessageText }}>Chat background</p>
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="text-xs font-semibold disabled:opacity-50"
              style={{ color: theme.myMessageBubble }}
            >
              {busy ? 'Saving...' : chatBackground ? 'Change' : 'Add image'}
            </button>
            {chatBackground && (
              <button type="button" onClick={clearChatBackgroundImage} className="text-xs font-semibold text-red-500">
                Remove
              </button>
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTheme(t);
              onClose();
            }}
            className="p-3 rounded-xl flex flex-col items-center gap-2 transition-all"
            {...getNeumorphicProps(1, 1, 1, 1, theme.id === t.id, true)}
          >
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.myMessageBubble }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.otherMessageBubble }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.background }} />
            </div>
            <span className="text-xs font-medium" style={{ color: theme.otherMessageText }}>{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemePicker;
