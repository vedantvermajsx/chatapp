import { useEffect, useRef } from 'react';

const RAMP = ' .:-=+*#%@';

export default function AsciiField({ className = '', cols = 64, opacity = 1 }) {
  const preRef = useRef(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return undefined;

    const rows = Math.max(1, Math.round(cols * 0.42)); // monospace cell aspect correction
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = null;
    let hidden = document.hidden;

    const render = (t) => {
      let out = '';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const v =
            Math.sin(x * 0.25 + t * 0.0006) +
            Math.sin(y * 0.35 + t * 0.0009) +
            Math.sin((x + y) * 0.15 - t * 0.0004);
          const lum = (v + 3) / 6;
          const idx = Math.min(RAMP.length - 1, Math.max(0, Math.round(lum * (RAMP.length - 1))));
          out += RAMP[idx];
        }
        out += '\n';
      }
      pre.textContent = out;
    };

    const loop = (now) => {
      if (!hidden) render(now);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf) cancelAnimationFrame(raf);
      if (mq.matches) {
        render(0);
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    const onVisibility = () => { hidden = document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);
    mq.addEventListener('change', start);
    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      mq.removeEventListener('change', start);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [cols]);

  return (
    <pre
      ref={preRef}
      aria-hidden="true"
      className={`select-none pointer-events-none font-mono leading-[1.05] tracking-tighter whitespace-pre ${className}`}
      style={{ opacity }}
    />
  );
}
