import { useTheme } from '../../contexts/ThemeContext';

const Avatar = ({ url, name, gender, size = 12, mdSize, isOnline, lastSeen, style }) => {
  const { theme } = useTheme();
  
  return (
    <div className="relative">
      <div
        className={`w-${size} h-${size} ${mdSize ? `md:w-${mdSize} md:h-${mdSize}` : ''} rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0`}
        style={{ 
          boxShadow: theme.isLight 
            ? '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)' 
            : '2px 2px 4px rgba(0,0,0,0.4), -2px -2px 4px rgba(255,255,255,0.05)',
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
            backgroundColor: isOnline ? '#10b981' : '#9ca3af',
            borderColor: theme.background
          }}
        />
      )}
    </div>
  );
};

export default Avatar;