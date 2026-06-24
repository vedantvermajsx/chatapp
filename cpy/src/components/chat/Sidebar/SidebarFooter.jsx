import { Settings, Palette, LogOut } from 'lucide-react';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const SidebarFooter = ({ user, onShowSettings, onToggleThemePicker, onLogout }) => {
  const { theme, getNeumorphicProps } = useNeumorphism();

  return (
    <div className="p-3 md:p-4 border-t mt-auto flex items-center justify-start" style={{ backgroundColor: theme.background, borderColor: theme.isLight ? '#cbd5e0' : '#4a5568' }}>
      {user.role !== 'guest' && (
        <button
          onClick={onShowSettings}
          className="p-2 md:p-3 mr-3 md:mr-4 rounded-full transition-all"
          title="Settings"
          {...getNeumorphicProps(1, 3, 2, 4)}
        >
          <Settings className="w-4 h-4 md:w-5 md:h-5" style={{ color: theme.otherUsernameColor }} />
        </button>
      )}
      <button
        onClick={onToggleThemePicker}
        className="p-2 md:p-3 mr-3 md:mr-4 rounded-full transition-all"
        title="Theme"
        {...getNeumorphicProps(1, 3, 2, 4)}
      >
        <Palette className="w-4 h-4 md:w-5 md:h-5" style={{ color: theme.otherUsernameColor }} />
      </button>
      <button
        onClick={onLogout}
        className="p-2 md:p-3 rounded-full transition-all"
        title="Logout"
        {...getNeumorphicProps(1, 3, 2, 4)}
      >
        <LogOut className="w-4 h-4 md:w-5 md:h-5" style={{ color: theme.otherUsernameColor }} />
      </button>
    </div>
  );
};

export default SidebarFooter;
