import { useId, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { formatNumber } from '../../utils/formatNumber';
import { formatShortDate } from '../../utils/formatShortDate';

const VIEW_W = 320;
const VIEW_H = 100;

export default function LineChart({ data = [], color, secondaryColor }) {
  const { theme } = useTheme();
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);
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
    return [x, y];
  });

  const line = `M${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L')}`;
  const area = `${line} L${VIEW_W},${VIEW_H} L0,${VIEW_H} Z`;

  let activeX = 0;
  let activeY = 0;
  let tooltipLeft = 0;
  if (hover != null && data[hover]) {
    const r = wrapRef.current?.getBoundingClientRect();
    const w = r?.width || 0;
    const h = r?.height || 0;
    activeX = w ? (points[hover][0] / VIEW_W) * w : 0;
    activeY = h ? (points[hover][1] / VIEW_H) * h : 0;
    tooltipLeft = Math.min(Math.max(activeX, 56), Math.max(w - 56, 56));
  }
  const active = hover != null ? data[hover] : null;

  const handleMove = (e) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const ratio = (e.clientX - r.left) / r.width;
    setHover(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))));
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={wrapRef}
        className="relative h-32 cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" className="w-full h-full block" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2={VIEW_W}
              y1={VIEW_H * f}
              y2={VIEW_H * f}
              stroke={theme.muted}
              strokeOpacity="0.14"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
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

        {active && (
          <>
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: activeX, width: 1, backgroundColor: stroke, opacity: 0.4 }}
            />
            <div
              className="absolute pointer-events-none rounded-full"
              style={{ left: activeX - 4, top: activeY - 4, width: 8, height: 8, backgroundColor: stroke, boxShadow: `0 0 0 2px ${theme.otherMessageBubble}` }}
            />
            <div
              className="absolute top-0 pointer-events-none rounded-lg px-2 py-1 text-[11px] font-medium shadow-lg whitespace-nowrap"
              style={{ left: tooltipLeft, transform: 'translateX(-50%)', backgroundColor: theme.otherMessageBubble, color: theme.otherMessageText }}
            >
              <span className="font-semibold">{formatNumber(active.count)}</span>
              <span style={{ color: theme.muted }}> · {formatShortDate(active.date)}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px]" style={{ color: theme.muted }}>
        <span>{formatShortDate(data[0].date)}</span>
        <span>peak {max} • total {formatNumber(total)}</span>
        <span>{formatShortDate(data[n - 1].date)}</span>
      </div>
    </div>
  );
}
