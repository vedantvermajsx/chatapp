import { useTheme } from '../contexts/ThemeContext';

export const useNeumorphism = () => {
  const { theme } = useTheme();

  const getShadow = (isLight, inset, size, blur) => {
    const c1 = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.4)';
    const c2 = isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.05)';
    const prefix = inset ? 'inset ' : '';
    return `${prefix}${size}px ${size}px ${blur}px ${c1}, ${prefix} -${size}px -${size}px ${blur}px ${c2}`;
  };

  const getNeumorphicProps = (baseSize, baseBlur, hoverSize, hoverBlur, isInsetBase = false, isInsetHover = true) => ({
    style: {
      backgroundColor: theme.background,
      boxShadow: getShadow(theme.isLight, isInsetBase, baseSize, baseBlur)
    },
    onMouseEnter: (e) => {
      e.currentTarget.style.boxShadow = getShadow(theme.isLight, isInsetHover, hoverSize, hoverBlur);
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.boxShadow = getShadow(theme.isLight, isInsetBase, baseSize, baseBlur);
    }
  });

  const getInputProps = (baseSize, baseBlur, focusSize, focusBlur) => ({
    style: {
      backgroundColor: theme.background,
      color: theme.otherMessageText,
      boxShadow: getShadow(theme.isLight, true, baseSize, baseBlur)
    },
    onFocus: (e) => {
      e.target.style.boxShadow = getShadow(theme.isLight, true, focusSize, focusBlur);
    },
    onBlur: (e) => {
      e.target.style.boxShadow = getShadow(theme.isLight, true, baseSize, baseBlur);
    }
  });

  return { getShadow, getNeumorphicProps, getInputProps, theme };
};
