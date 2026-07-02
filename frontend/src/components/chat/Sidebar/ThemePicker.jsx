import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { THEMES } from '../../../contexts/THEMES';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const ThemePicker = ({ show, onClose }) => {
  const { theme, setTheme } = useTheme();
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
