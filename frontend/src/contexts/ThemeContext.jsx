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
    document.body.style.color = theme.isLight ? '#000000' : '#ffffff';
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
