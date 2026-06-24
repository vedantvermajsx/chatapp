import { useTheme } from '../../../contexts/ThemeContext';

function MemberSkeleton() {
  const { theme } = useTheme();
  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
      style={{ 
        backgroundColor: theme.background,
        boxShadow: isLight ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)' : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
      }}
    >
      <div 
        className="w-12 h-12 rounded-full"
        style={{ backgroundColor: isLight ? 'rgba(192, 182, 182, 0.6)' : 'rgba(74, 85, 104, 0.6)' }}
      />
      <div className="flex-1 space-y-2">
        <div 
          className="h-4 rounded-full w-1/2"
          style={{ backgroundColor: isLight ? 'rgba(192, 182, 182, 0.6)' : 'rgba(74, 85, 104, 0.6)' }}
        />
        <div 
          className="h-3 rounded-full w-1/3"
          style={{ backgroundColor: isLight ? 'rgba(192, 182, 182, 0.6)' : 'rgba(74, 85, 104, 0.6)' }}
        />
      </div>
      <div 
        className="w-10 h-10 rounded-full"
        style={{ backgroundColor: isLight ? 'rgba(192, 182, 182, 0.6)' : 'rgba(74, 85, 104, 0.6)' }}
      />
    </div>
  );
}

export default MemberSkeleton;
