import { Settings, Palette, LogOut } from 'lucide-react';
import { useNeumorphism } from '../../../hooks/useNeumorphism';
import Avatar from '../../common/Avatar';

const SidebarFooter = ({ user, onShowSettings, onToggleThemePicker, onLogout }) => {
  const { theme, getNeumorphicProps } = useNeumorphism();
  const border = theme.isLight ? '#cbd5e0' : '#4a5568';

  return (
    <div
      className="px-3 md:px-4 py- flex-shrink-0 flex items-center gap-2"
      style={{ borderColor: border, backgroundColor: theme.background }}
    >
      { }
      <div className="flex items-center gap-2 flex-1 min-w-0 mr-1">
        <Avatar url={user.avatar} name={user.username} gender={user.gender} size={8} />
        <span className="text-xs font-semibold truncate" style={{ color: theme.otherMessageText }}>
          {user.username}
        </span>
      </div>

      { }
      <div className="flex items-center gap-2 flex-shrink-0">
        {user.role !== 'guest' && (
          <button
            onClick={onShowSettings}
            className="p-1 rounded-xl transition-all"
            title="Settings"
            {...getNeumorphicProps(1, 4, 0, 0)}
          >
            <Settings className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />
          </button>
        )}
        <button
          onClick={onToggleThemePicker}
          className="p-1 rounded-xl transition-all"
          title="Theme"
          {...getNeumorphicProps(1, 4, 0, 0)}
        >
          <Palette className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />
        </button>
        <button
          onClick={onLogout}
          className="p-1 rounded-xl transition-all"
          title="Logout"
          {...getNeumorphicProps(1, 4, 0, 0)}
        >
          <LogOut className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />
        </button>
      </div>
    </div>
  );
};

export default SidebarFooter;
