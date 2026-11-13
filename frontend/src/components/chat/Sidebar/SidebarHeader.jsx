import { X, RefreshCw } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const SidebarHeader = ({ showMobileClose, onCloseSidebar, onSyncAll, syncingAll = false }) => {
  const { theme } = useTheme();
  const borderColor = theme.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.4)';

  return (
    <div
      className="px-4 py-3 flex items-center justify-between flex-shrink-0"
      style={{
        borderBottom: `1px solid ${borderColor}`,
        minHeight: '48px',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        >
          <img src="/icon.png" alt="GatherUp" className="w-7 h-7 object-contain bg-transparent" />
        </div>
        <span
          className="text-[16px] font-semibold tracking-tight truncate leading-tight"
          style={{ color: theme.isLight ? '#060607' : '#f2f3f5' }}
        >
          GatherUp
        </span>
      </div>

      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
      {onSyncAll && (
        <button
          onClick={onSyncAll}
          disabled={syncingAll}
          title="Sync all chats"
          aria-label="Sync all chats"
          className="p-1.5 rounded-md transition-colors flex items-center justify-center disabled:opacity-60"
          style={{ color: theme.isLight ? '#4e5058' : '#b5bac1' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.isLight
              ? 'rgba(0,0,0,0.06)'
              : 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
        </button>
      )}

      {showMobileClose && (
        <button
          onClick={onCloseSidebar}
          className="p-1.5 rounded-md transition-colors flex-shrink-0 flex items-center justify-center"
          style={{ color: theme.isLight ? '#4e5058' : '#b5bac1' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.isLight
              ? 'rgba(0,0,0,0.06)'
              : 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X className="w-4 h-4" />
        </button>
      )}
      </div>
    </div>
  );
};

export default SidebarHeader;
