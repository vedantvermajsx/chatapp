import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { THEMES } from '../../../contexts/THEMES';
import { DEFAULT_CHAT_BG_SETTINGS } from '../../../utils/chatBackground';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const BG_CONTROLS = [
  { key: 'blur', label: 'Blur', min: 0, max: 20, step: 1, suffix: 'px' },
  { key: 'opacity', label: 'Opacity', min: 10, max: 100, step: 1, suffix: '%' },
  { key: 'contrast', label: 'Contrast', min: 50, max: 200, step: 1, suffix: '%' },
];

const ThemePicker = ({ show, onClose }) => {
  const { theme, setTheme, chatBackground, setChatBackgroundImage, clearChatBackgroundImage, chatBackgroundSettings, updateChatBackgroundSettings } = useTheme();
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
        <button
          type="button"
          onClick={onClose}
          aria-label="Close theme selector"
          className="p-1 rounded-full transition-opacity hover:opacity-70"
          style={{ color: theme.otherMessageText }}
        >
          <X className="w-4 h-4" />
        </button>
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
              style={{ color: theme.primary || theme.myMessageBubble }}
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
      {chatBackground && (
        <div className="mb-4 flex flex-col gap-2.5">
          {BG_CONTROLS.map(({ key, label, min, max, step, suffix }) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="flex justify-between text-[11px] font-semibold" style={{ color: theme.otherMessageText }}>
                <span>{label}</span>
                <span style={{ color: theme.muted }}>{chatBackgroundSettings[key]}{suffix}</span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={chatBackgroundSettings[key]}
                onChange={(e) => updateChatBackgroundSettings({ [key]: Number(e.target.value) })}
                className="w-full cursor-pointer"
                style={{ accentColor: theme.primary || theme.myMessageBubble }}
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => updateChatBackgroundSettings(DEFAULT_CHAT_BG_SETTINGS)}
            className="self-start text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: theme.primary || theme.myMessageBubble }}
          >
            Reset
          </button>
        </div>
      )}
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
