import { useTheme } from '../../contexts/ThemeContext';
import Avatar from '../common/Avatar';
import { formatNumber } from '../../utils/formatNumber';

export default function Leaderboard({ rows, emptyLabel }) {
  const { theme } = useTheme();
  if (!rows?.length) {
    return <p className="text-xs" style={{ color: theme.muted }}>{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={r.roomId || i} className="flex items-center gap-3">
          <span className="w-4 text-xs font-bold" style={{ color: theme.muted }}>{i + 1}</span>
          <Avatar url={r.groupPic} name={r.groupName} size={7} />
          <span className="flex-1 truncate text-sm" style={{ color: theme.otherMessageText }}>{r.groupName}</span>
          <span className="text-xs font-semibold" style={{ color: theme.otherUsernameColor }}>{formatNumber(r.count)}</span>
        </div>
      ))}
    </div>
  );
}
