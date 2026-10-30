import { useTheme } from '../../contexts/ThemeContext';
import { formatNumber } from '../../utils/formatNumber';
import { formatShortDate } from '../../utils/formatShortDate';

export default function BarChart({ data, color, secondaryColor }) {
  const { theme } = useTheme();
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((a, d) => a + d.count, 0);

  if (!data.length) {
    return <div className="h-32 flex items-center justify-center text-xs" style={{ color: theme.muted }}>No data</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-[2px] h-32">
        {data.map((d) => {
          const pct = (d.count / max) * 100;
          return (
            <div
              key={d.date}
              className="flex-1 rounded-sm transition-all"
              title={`${formatShortDate(d.date)} • ${d.count}`}
              style={{
                height: `${Math.max(pct, d.count > 0 ? 3 : 0)}%`,
                minHeight: d.count > 0 ? 3 : 0,
                backgroundColor: d.count > 0 ? (secondaryColor || color) : 'transparent',
                opacity: d.count > 0 ? 1 : 0,
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px]" style={{ color: theme.muted }}>
        <span>{formatShortDate(data[0].date)}</span>
        <span>peak {max} • total {formatNumber(total)}</span>
        <span>{formatShortDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}
