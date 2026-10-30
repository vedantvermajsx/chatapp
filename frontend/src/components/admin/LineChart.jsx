import { useId } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { formatNumber } from '../../utils/formatNumber';
import { formatShortDate } from '../../utils/formatShortDate';

const VIEW_W = 320;
const VIEW_H = 100;

export default function LineChart({ data = [], color, secondaryColor }) {
  const { theme } = useTheme();
  const gradientId = useId().replace(/:/g, '');
  const stroke = secondaryColor || color;

  if (!data.length) {
    return <div className="h-32 flex items-center justify-center text-xs" style={{ color: theme.muted }}>No data</div>;
  }

  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((a, d) => a + d.count, 0);
  const n = data.length;
  const stepX = n > 1 ? VIEW_W / (n - 1) : 0;

  const points = data.map((d, i) => {
    const x = n > 1 ? i * stepX : VIEW_W / 2;
    const y = VIEW_H - (d.count / max) * (VIEW_H - 8) - 4;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const line = `M${points.join(' L')}`;
  const area = `${line} L${VIEW_W},${VIEW_H} L0,${VIEW_H} Z`;

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" className="w-full h-32" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-center justify-between text-[10px]" style={{ color: theme.muted }}>
        <span>{formatShortDate(data[0].date)}</span>
        <span>peak {max} • total {formatNumber(total)}</span>
        <span>{formatShortDate(data[n - 1].date)}</span>
      </div>
    </div>
  );
}
