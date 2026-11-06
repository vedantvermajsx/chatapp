import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import TourTooltip from './TourTooltip';
import { TOUR_STEPS } from './tourSteps';

const RING_PAD = 6;
const GAP = 14;
const TOOLTIP_W = 320;
const EDGE = 12;
const DIM = 'rgba(0,0,0,0.55)';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// First visible [data-tour="…"] element, ignoring hidden/zero-size ones.
const measureTarget = (target) => {
  if (!target) return null;
  const nodes = document.querySelectorAll(`[data-tour="${target}"]`);
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    if (r.width > 4 && r.height > 4) {
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    }
  }
  return null;
};

const tooltipStyle = (rect, placement, height) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(TOOLTIP_W, vw - EDGE * 2);
  const h = height || 200;
  const maxTop = Math.max(EDGE, vh - h - EDGE);
  const base = { position: 'fixed', width, left: EDGE, top: EDGE, zIndex: 10000 };

  if (!rect) {
    return { position: 'fixed', width, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10000 };
  }

  const prefer = placement || 'bottom';

  if (prefer === 'right' || prefer === 'left') {
    const raw = prefer === 'right' ? rect.left + rect.width + GAP : rect.left - GAP - width;
    const left = clamp(raw, EDGE, Math.max(EDGE, vw - width - EDGE));
    return { ...base, left, top: clamp(rect.top + 16, EDGE, maxTop) };
  }

  const left = clamp(rect.left, EDGE, Math.max(EDGE, vw - width - EDGE));
  const belowTop = rect.top + rect.height + GAP;
  const aboveTop = rect.top - GAP - h;
  const insideTop = clamp(rect.top + GAP, EDGE, maxTop);

  // Tall targets (e.g. the chat area) leave no room outside, so the tooltip sits inside them.
  if (prefer === 'bottom') {
    if (belowTop + h <= vh - EDGE) return { ...base, left, top: belowTop };
    if (aboveTop >= EDGE) return { ...base, left, top: aboveTop };
    return { ...base, left, top: insideTop };
  }
  if (aboveTop >= EDGE) return { ...base, left, top: aboveTop };
  if (belowTop + h <= vh - EDGE) return { ...base, left, top: belowTop };
  return { ...base, left, top: insideTop };
};

const Tour = ({ onDone }) => {
  const { theme } = useTheme();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [tipH, setTipH] = useState(200);
  const cardRef = useRef(null);
  const step = TOUR_STEPS[index];

  const measure = useCallback(() => {
    setRect(measureTarget(step?.target));
  }, [step]);

  useLayoutEffect(() => {
    const h = cardRef.current?.offsetHeight;
    if (h && Math.abs(h - tipH) > 1) setTipH(h);
  }, [index, rect, tipH]);

  useLayoutEffect(() => {
    measure();
    const raf = requestAnimationFrame(measure);
    const timer = setTimeout(measure, 280); // re-check once layout settles
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onDone(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  const next = useCallback(() => {
    if (index + 1 >= TOUR_STEPS.length) onDone();
    else setIndex(index + 1);
  }, [index, onDone]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  const ring = rect
    ? {
        position: 'fixed',
        top: rect.top - RING_PAD,
        left: rect.left - RING_PAD,
        width: rect.width + RING_PAD * 2,
        height: rect.height + RING_PAD * 2,
        borderRadius: 12,
        boxShadow: `0 0 0 9999px ${DIM}`,
        border: `2px solid ${theme.primary || '#6366f1'}`,
        zIndex: 9998,
        pointerEvents: 'none',
      }
    : null;

  return (
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 9997, backgroundColor: rect ? 'transparent' : DIM }}
      />
      {ring && <div style={ring} />}
      <TourTooltip
        cardRef={cardRef}
        step={step}
        index={index}
        total={TOUR_STEPS.length}
        style={tooltipStyle(rect, step?.placement, tipH)}
        onNext={next}
        onBack={back}
        onSkip={onDone}
      />
    </>
  );
};

export default Tour;
