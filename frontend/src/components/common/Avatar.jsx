import { useTheme } from '../../contexts/ThemeContext';
import { useNeumorphism } from '../../hooks/useNeumorphism';

const Avatar = ({ url, name, gender, size = 12, mdSize, isOnline, lastSeen, style }) => {
  const { theme } = useTheme();
  const { getShadow } = useNeumorphism();

  return (
    <div className="relative">
      <div
        className={`w-${size} h-${size} ${mdSize ? `md:w-${mdSize} md:h-${mdSize}` : ''} rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0`}
        style={{
          boxShadow: getShadow(theme.isLight, false, 2, 4),
          ...style
        }}
        title={name}
      >
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {typeof isOnline === 'boolean' && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 z-10"
          style={{
            backgroundColor: isOnline ? '#00ff00' : '#9ca3af',
            borderColor: theme.background
          }}
        />
      )}
    </div>
  );
};

export default Avatar;