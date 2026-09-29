import { Settings, Palette, LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import Avatar from '../../common/Avatar';
import SecurityPolicyModal from '../Modals/SecurityPolicyModal';

const SidebarFooter = ({ user, onShowSettings, onToggleThemePicker, onLogout }) => {
  const [showSecurityPolicy, setShowSecurityPolicy] = useState(false);
  const { theme } = useTheme();
  const panelBg = theme.isLight ? '#f2f3f5' : '#232428';
  const borderColor = theme.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.4)';
  const iconColor = theme.isLight ? '#4e5058' : '#b5bac1';
  const iconHoverBg = theme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  return (
    <>
      <div
        className="mx-2 my-1 flex-shrink-0 flex items-center gap-2 px-2 py-1.5 rounded"
        style={{ backgroundColor: panelBg }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar url={user.avatar} name={user.username} gender={user.gender} size={8} />
          <div className="min-w-0">
            <p
              className="text-[14px] font-semibold truncate leading-tight"
              style={{ color: theme.isLight ? '#060607' : '#f2f3f5' }}
            >
              {user.username}
            </p>
            <p
              className="text-[12px] truncate leading-tight"
              style={{ color: theme.isLight ? '#7d8088' : '#949ba4' }}
            >
              {user.role === 'guest' ? 'Guest' : 'Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          {user.role !== 'guest' && (
            <button
              onClick={onShowSettings}
            className="p-1.5 rounded transition-colors flex items-center justify-center"
            title="User Settings"
            style={{ color: iconColor }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = iconHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Settings className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
            </button>
          )}
          <button
            onClick={onToggleThemePicker}
            className="p-1.5 rounded transition-colors flex items-center justify-center"
            title="Switch Theme"
            style={{ color: iconColor }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = iconHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Palette className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
          </button>
          <button
            onClick={() => setShowSecurityPolicy(true)}
            className="p-1.5 rounded transition-colors flex items-center justify-center"
            title="Security & Policy"
            style={{ color: iconColor }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = iconHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <ShieldCheck className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
          </button>
          <button
            onClick={onLogout}
            className="p-1.5 rounded transition-colors flex items-center justify-center"
            title="Log Out"
            style={{ color: iconColor }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = iconHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <LogOut className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>

      {showSecurityPolicy && (
        <SecurityPolicyModal onClose={() => setShowSecurityPolicy(false)} />
      )}
    </>
  );
};

export default SidebarFooter;
