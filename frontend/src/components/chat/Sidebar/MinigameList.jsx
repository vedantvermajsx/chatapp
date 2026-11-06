import { memo, useState } from 'react';
import { ChevronDown, ChevronRight, Gamepad2 } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { MINIGAMES } from '../../../utils/minigames';
import MinigameItem from './MinigameItem';

const MinigameList = memo(function MinigameList({ onCloseSidebar }) {
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const headerColor = theme.isLight ? '#4e5058' : '#949ba4';

  return (
    <div className="mt-1" data-tour="minigames">
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-0.5 px-2 py-1 group transition-colors"
        style={{ color: headerColor }}
        onMouseEnter={(e) => { e.currentTarget.style.color = theme.isLight ? '#060607' : '#f2f3f5'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = headerColor; }}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
          : <ChevronDown className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
        }
        <span className="text-[12px] font-bold uppercase tracking-wide leading-tight truncate">
          Minigames
        </span>
        <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <Gamepad2 className="w-3 h-3" strokeWidth={2} />
        </span>
      </button>
      {!collapsed && (
        <div className="mt-0.5">
          {Object.entries(MINIGAMES).map(([key, game]) => (
            <MinigameItem key={key} game={key} label={game.label} Icon={game.Icon} onOpen={onCloseSidebar} />
          ))}
        </div>
      )}
    </div>
  );
});

export default MinigameList;
