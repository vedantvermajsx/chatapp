import { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from './THEMES';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('chatTheme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        const existingTheme = THEMES.find(t => t.id === parsedTheme.id);
        return existingTheme || THEMES[0];
      } catch {
        return THEMES[0];
      }
    }
    return THEMES[0];
  });

  useEffect(() => {
    localStorage.setItem('chatTheme', JSON.stringify(theme));
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
