import { Settings, Palette, LogOut, ShieldCheck, Download, Activity } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDownloads } from '../../../contexts/DownloadsContext';
import Avatar from '../../common/Avatar';
import SecurityPolicyModal from '../Modals/SecurityPolicyModal';
import DownloadsModal from '../Modals/DownloadsModal';

const SidebarFooter = ({ user, onShowSettings, onToggleThemePicker, onLogout }) => {
  const [showSecurityPolicy, setShowSecurityPolicy] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const { theme } = useTheme();
  const { activeCount } = useDownloads();
  const navigate = useNavigate();
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
          {(user.isAdmin || user.role === 'admin') && (
            <button
              onClick={() => navigate('/admin')}
              className="p-1.5 rounded transition-colors flex items-center justify-center"
              title="Admin Analytics"
              style={{ color: theme.isLight ? '#b45309' : '#fbbf24' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = iconHoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Activity className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
            </button>
          )}
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
          <button
            onClick={() => setShowDownloads(true)}
            className="relative p-1.5 rounded transition-colors flex items-center justify-center"
            title="Downloads"
            style={{ color: iconColor }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = iconHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Download className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
            {activeCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: theme.primary || '#6366f1', color: '#fff' }}
              >
                {activeCount > 9 ? '9+' : activeCount}
              </span>
            )}
          </button>
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

      {showDownloads && (
        <DownloadsModal onClose={() => setShowDownloads(false)} />
      )}
    </>
  );
};

export default SidebarFooter;
