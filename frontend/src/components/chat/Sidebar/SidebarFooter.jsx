import { Settings, Palette, LogOut } from 'lucide-react';
import { useNeumorphism } from '../../../hooks/useNeumorphism';
import Avatar from '../../common/Avatar';

const SidebarFooter = ({ user, onShowSettings, onToggleThemePicker, onLogout }) => {
  const { theme, getNeumorphicProps } = useNeumorphism();
  const border = theme.isLight ? '#cbd5e0' : '#4a5568';

  return (
    <div
      className="px-3 md:px-4 py-3 border-t flex-shrink-0 flex items-center gap-2"
      style={{ borderColor: border, backgroundColor: theme.background }}
    >
      {/* User avatar + name */}
      <div className="flex items-center gap-2 flex-1 min-w-0 mr-1">
        <Avatar url={user.avatar} name={user.username} gender={user.gender} size={8} />
        <span className="text-xs font-semibold truncate" style={{ color: theme.otherMessageText }}>
          {user.username}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {user.role !== 'guest' && (
          <button
            onClick={onShowSettings}
            className="p-2 rounded-xl transition-all"
            title="Settings"
            {...getNeumorphicProps(1, 2, 2, 4)}
          >
            <Settings className="w-3.5 h-3.5" style={{ color: theme.otherUsernameColor }} />
          </button>
        )}
        <button
          onClick={onToggleThemePicker}
          className="p-2 rounded-xl transition-all"
          title="Theme"
          {...getNeumorphicProps(1, 2, 2, 4)}
        >
          <Palette className="w-3.5 h-3.5" style={{ color: theme.otherUsernameColor }} />
        </button>
        <button
          onClick={onLogout}
          className="p-2 rounded-xl transition-all"
          title="Logout"
          {...getNeumorphicProps(1, 2, 2, 4)}
        >
          <LogOut className="w-3.5 h-3.5" style={{ color: theme.otherUsernameColor }} />
        </button>
      </div>
    </div>
  );
};

export default SidebarFooter;
