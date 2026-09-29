import { useTheme } from '../contexts/ThemeContext';

export const useNeumorphism = () => {
  const { theme } = useTheme();

  const getShadow = (isLight, inset, size, blur) => {
    if (inset) {
      const c = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.25)';
      return `inset 0 0 0 1px ${c}`;
    }
    const c = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.28)';
    return `0 1px 2px ${c}`;
  };

  const getNeumorphicProps = (baseSize, baseBlur, hoverSize, hoverBlur, isActive = false, isInsetHover = true) => ({
    style: {
      backgroundColor: isActive
        ? (theme.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)')
        : 'transparent',
      boxShadow: 'none',
      border: 'none',
      borderRadius: '8px',
      transition: 'background-color 0.12s ease, color 0.12s ease'
    },
    onMouseEnter: (e) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = theme.isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)';
      }
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = isActive
        ? (theme.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)')
        : 'transparent';
    }
  });

  const getInputProps = (baseSize, baseBlur, focusSize, focusBlur) => ({
    style: {
      backgroundColor: theme.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
      color: theme.otherMessageText,
      border: '1px solid transparent',
      boxShadow: 'none',
      borderRadius: '6px',
      transition: 'background-color 0.12s ease, border-color 0.12s ease'
    },
    onFocus: (e) => {
      e.target.style.backgroundColor = theme.background;
      e.target.style.borderColor = theme.myMessageBubble || '#5865f2';
    },
    onBlur: (e) => {
      e.target.style.backgroundColor = theme.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
      e.target.style.borderColor = 'transparent';
    }
  });

  return { getShadow, getNeumorphicProps, getInputProps, theme };
};
