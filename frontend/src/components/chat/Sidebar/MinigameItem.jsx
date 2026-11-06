import { memo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

const MinigameItem = memo(function MinigameItem({ game, label, Icon, onOpen }) {
  const { theme } = useTheme();

  const handleOpen = () => {
    window.dispatchEvent(new CustomEvent('open-minigame', { detail: { game } }));
    onOpen && onOpen();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Play ${label}`}
      onClick={handleOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } }}
      className="group relative mx-1 my-0.5 cursor-pointer transition-all"
    >
      <div
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-md ml-1 transition-colors duration-100"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.isLight
            ? 'rgba(78,80,88,0.10)'
            : 'rgba(79,84,92,0.24)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: theme.isLight ? 'rgba(78,80,88,0.12)' : 'rgba(79,84,92,0.28)' }}
        >
          {Icon && <Icon className="w-4 h-4" style={{ color: theme.textPrimary }} strokeWidth={2} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] truncate leading-tight" style={{ color: theme.muted }}>
            {label}
          </h3>
          <p className="text-[13px] truncate leading-tight mt-0.5" style={{ color: theme.muted }}>
            Tap to play
          </p>
        </div>
      </div>
    </div>
  );
});

export default MinigameItem;
