import { MessageCircle, X } from 'lucide-react';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const SidebarHeader = ({ showMobileClose, onCloseSidebar }) => {
  const { theme, getShadow, getNeumorphicProps } = useNeumorphism();

  return (
    <div className="p-4 md:p-6 border-b flex items-center justify-between md:hidden" style={{ borderColor: theme.isLight ? '#cbd5e0' : '#4a5568' }}>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center" style={{
          backgroundColor: theme.background,
          boxShadow: getShadow(theme.isLight, false, 2, 4)
        }}>
          <MessageCircle className="w-4 h-4 md:w-6 md:h-6" style={{ color: theme.otherUsernameColor }} />
        </div>
        <h2 className="text-lg md:text-xl font-bold" style={{ color: theme.otherMessageText }}>hushline</h2>
      </div>
      {showMobileClose && (
        <button
          onClick={onCloseSidebar}
          className="p-2 md:p-3 rounded-full transition-all"
          {...getNeumorphicProps(1, 3, 3, 6)}
        >
          <X className="w-4 h-4 md:w-6 md:h-6" style={{ color: theme.otherUsernameColor }} />
        </button>
      )}
    </div>
  );
};

export default SidebarHeader;
