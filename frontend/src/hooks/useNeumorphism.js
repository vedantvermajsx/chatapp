import { useTheme } from '../contexts/ThemeContext';

export const useNeumorphism = () => {
  const { theme } = useTheme();

  // Flat, minimal shadow system (size/blur args kept for API compatibility, only scale matters)
  const getShadow = (isLight, inset, size, blur) => {
    if (inset) {
      const c = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.35)';
      return `inset 0 0 0 1.5px ${c}`;
    }
    const c = isLight ? 'rgba(20,20,20,0.08)' : 'rgba(0,0,0,0.45)';
    return `0 1px 2px ${c}`;
  };

  const getNeumorphicProps = (baseSize, baseBlur, hoverSize, hoverBlur, isInsetBase = false, isInsetHover = true) => ({
    style: {
      backgroundColor: theme.background,
      boxShadow: getShadow(theme.isLight, isInsetBase, baseSize, baseBlur),
      border: `1px solid ${theme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
      transition: 'background-color 0.15s ease, box-shadow 0.15s ease'
    },
    onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = theme.isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = theme.background;
    }
  });

  const getInputProps = (baseSize, baseBlur, focusSize, focusBlur) => ({
    style: {
      backgroundColor: theme.background,
      color: theme.otherMessageText,
      border: `1.5px solid ${theme.isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
      boxShadow: 'none',
      transition: 'border-color 0.15s ease'
    },
    onFocus: (e) => {
      e.target.style.borderColor = theme.myMessageBubble || '#008080';
    },
    onBlur: (e) => {
      e.target.style.borderColor = theme.isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
    }
  });

  return { getShadow, getNeumorphicProps, getInputProps, theme };
};
