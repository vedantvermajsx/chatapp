import { useTheme } from '../../contexts/ThemeContext';
import { formatNumber } from '../../utils/formatNumber';

export default function GenderBars({ breakdown }) {
  const { theme } = useTheme();
  const items = [
    { label: 'Male', value: breakdown.male, color: '#3b82f6' },
    { label: 'Female', value: breakdown.female, color: '#ec4899' },
    { label: 'Other', value: breakdown.other, color: '#8b5cf6' },
  ];
  const total = Math.max(1, items.reduce((a, b) => a + b.value, 0));
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-1">
          <div className="flex justify-between text-xs" style={{ color: theme.muted }}>
            <span>{it.label}</span>
            <span>{formatNumber(it.value)} ({Math.round((it.value / total) * 100)}%)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.background }}>
            <div className="h-full rounded-full" style={{ width: `${(it.value / total) * 100}%`, backgroundColor: it.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
