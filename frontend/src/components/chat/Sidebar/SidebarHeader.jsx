import { MessageSquare, X } from 'lucide-react';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const SidebarHeader = ({ showMobileClose, onCloseSidebar }) => {
  const { theme, getShadow, getNeumorphicProps } = useNeumorphism();
  const border = theme.isLight ? '#cbd5e0' : '#4a5568';

  return (
    <div
      className="px-4 md:px-6 py-4 md:py-5 flex items-center justify-between border-b flex-shrink-0"
      style={{ borderColor: border }}
    >
      {}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ boxShadow: getShadow(theme.isLight, false, 2, 5), backgroundColor: theme.background }}
        >
          <MessageSquare className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />
        </div>
        <span className="text-base font-bold tracking-tight" style={{ color: theme.otherMessageText }}>
          HushLine
        </span>
      </div>

      {}
      {showMobileClose && (
        <button
          onClick={onCloseSidebar}
          className="p-2 rounded-xl transition-all"
          {...getNeumorphicProps(1, 3, 2, 4)}
        >
          <X className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />
        </button>
      )}
    </div>
  );
};

export default SidebarHeader;
