import { memo } from 'react';

/**
 * Mini loaders. Pure CSS, transform/opacity only (compositor-friendly, no JS timers).
 * Drop-in for lucide's Loader2: accepts className (w-4 h-4 etc), style, color, size.
 * variant: 'ring' (default) | 'dots' | 'bars'
 */
const VARIANT_CLASS = { ring: 'ld-ring', dots: 'ld-dots', bars: 'ld-bars' };

const Loader = memo(function Loader({ variant = 'ring', size, color, className = '', style, label = 'Loading', ...rest }) {
  const cls = className.replace(/\banimate-spin\b/g, '').trim();
  const dim = typeof size === 'number' ? { width: size, height: size } : null;
  const props = {
    role: 'status',
    'aria-label': label,
    className: `ld ${VARIANT_CLASS[variant] || 'ld-ring'} ${cls}`,
    style: { ...dim, ...(color ? { color } : null), ...style },
  };

  if (variant === 'dots') {
    return <span {...props}><i /><i /><i /></span>;
  }
  if (variant === 'bars') {
    return <span {...props}><i /><i /><i /></span>;
  }
  return (
    <span {...props}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="15 42" />
      </svg>
    </span>
  );
});

export default Loader;
