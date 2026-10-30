import { useTheme } from '../../contexts/ThemeContext';
import { formatNumber } from '../../utils/formatNumber';

export default function RetentionBars({ activity }) {
  const { theme } = useTheme();
  const items = [
    { label: 'DAU', value: activity.dau, color: '#22c55e' },
    { label: 'WAU', value: activity.wau, color: '#f59e0b' },
    { label: 'MAU', value: activity.mau, color: '#6366f1' },
  ];
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex items-end gap-4 h-32">
      {items.map((it) => (
        <div key={it.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-xs font-semibold" style={{ color: theme.otherMessageText }}>{formatNumber(it.value)}</span>
          <div
            className="w-full rounded-t-md"
            style={{ height: `${Math.max((it.value / max) * 100, 2)}%`, backgroundColor: it.color }}
          />
          <span className="text-[10px]" style={{ color: theme.muted }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
