import { X } from 'lucide-react';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const SidebarHeader = ({ showMobileClose, onCloseSidebar }) => {
  const { theme, getShadow, getNeumorphicProps } = useNeumorphism();
  const border = theme.isLight ? '#cbd5e0' : '#4a5568';

  return (
    <div
      className="px-4 md:px-6 py-4 md:py-5 flex items-center justify-between  flex-shrink-0"
      style={{ borderColor: border }}
    >
      { }
      <div className="flex items-center gap-3">
        <span className="text-base font-bold tracking-tight max-md:ml-32" style={{ color: theme.otherMessageText }}>
          GatherUp
        </span>
      </div>

      { }
      {showMobileClose && (
        <button
          onClick={onCloseSidebar}
          className="p-2 rounded-xl transition-all"
          {...getNeumorphicProps(1, 1, 2, 2)}
        >
          <X className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />
        </button>
      )}
    </div>
  );
};

export default SidebarHeader;
