import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { THEMES } from './THEMES';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('chatTheme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        const existingTheme = THEMES.find(t => t.id === parsedTheme.id);
        return existingTheme || THEMES.find(t => t.id === 'discord-midnight') || THEMES[0];
      } catch {
        return THEMES.find(t => t.id === 'discord-midnight') || THEMES[0];
      }
    }
    return THEMES.find(t => t.id === 'discord-midnight') || THEMES[0];
  });

  useEffect(() => {
    localStorage.setItem('chatTheme', JSON.stringify(theme));
    document.body.style.backgroundColor = theme.background;
    const r = document.documentElement.style;
    r.setProperty('--g-bg', theme.background);
    r.setProperty('--g-fg', theme.otherMessageText);
    r.setProperty('--g-accent', theme.myMessageBubble);
    r.setProperty('--g-line', theme.isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.09)');
    r.setProperty('--g-hi', theme.isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.08)');
    r.setProperty('--g-shadow', theme.isLight ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.45)');
    document.body.style.color = theme.isLight ? '#000000' : '#ffffff';

    let metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme.background);
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, THEMES }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
