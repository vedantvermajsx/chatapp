import { useTheme } from '../../../contexts/ThemeContext';

const TourTooltip = ({ step, index, total, style, cardRef, onNext, onBack, onSkip }) => {
  const { theme } = useTheme();
  if (!step) return null;

  const Icon = step.icon;
  const isLight = theme.isLight;
  const bg = isLight ? '#ffffff' : '#232428';
  const fg = isLight ? '#111214' : '#f2f3f5';
  const sub = isLight ? '#4e5058' : '#b5bac1';
  const accent = theme.primary || '#6366f1';
  const isLast = index === total - 1;

  return (
    <div ref={cardRef} style={style}>
      <div
        className="pop-in rounded-2xl p-4"
        role="dialog"
        aria-modal="true"
        style={{ backgroundColor: bg, border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, boxShadow: '0 18px 48px rgba(0,0,0,0.35)' }}
      >
        <div className="flex items-center gap-2.5 mb-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}22` }}
          >
            <Icon className="h-4 w-4" style={{ color: accent }} strokeWidth={2} />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: sub }}>
            {index + 1} of {total}
          </span>
        </div>

        <h3 className="text-[15px] font-bold leading-tight mb-1" style={{ color: fg }}>
          {step.title}
        </h3>
        <p className="text-[13px] leading-[1.5]" style={{ color: sub }}>
          {step.description}
        </p>

        <div className="flex items-center gap-1.5 mt-3.5 mb-3">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 16 : 6,
                backgroundColor: i === index ? accent : (isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.18)'),
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] font-semibold px-1 py-1.5 rounded transition-opacity hover:opacity-70"
            style={{ color: sub }}
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={onBack}
                className="text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: fg, backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="text-[13px] font-semibold px-3.5 py-1.5 rounded-lg transition-[filter] hover:brightness-110"
              style={{ color: theme.onPrimary, backgroundColor: accent }}
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourTooltip;
