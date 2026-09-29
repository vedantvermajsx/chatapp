import { useRef, useState, useEffect, useCallback } from 'react';
import { Minus, X, Maximize2, Crown } from 'lucide-react';

const BASE_URL = (import.meta.env.VITE_LOAD_BALENCER_URL || '').replace(/\/+$/, '');
const WIN_W = 400;
const MIN_W = 220;
const EDGE = 12;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// Floating, draggable chess window (like the call window).
// - Minimize keeps the iframe mounted (hidden) so the game/clock keep running.
// - Close unmounts it; the server gives a 60s grace period to come back.
const ChessWindow = ({ username, joinCode, onClose, onGameCreated, onActiveChange }) => {
  const [minimized, setMinimized] = useState(false);
  const [height, setHeight] = useState(620);
  const [gameActive, setGameActive] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [status, setStatus] = useState('Chess');

  const elRef = useRef(null);
  const iframeRef = useRef(null);
  const posRef = useRef({
    x: Math.max(EDGE, window.innerWidth - WIN_W - 24),
    y: 72,
  });
  const dragRef = useRef(null);
  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;
  const onCreatedRef = useRef(onGameCreated);
  onCreatedRef.current = onGameCreated;

  const width = () => Math.min(WIN_W, window.innerWidth - EDGE * 2);

  const applyPos = useCallback(() => {
    if (!elRef.current) return;
    const w = elRef.current.offsetWidth || width();
    const h = elRef.current.offsetHeight || 48;
    posRef.current = {
      x: clamp(posRef.current.x, EDGE, Math.max(EDGE, window.innerWidth - w - EDGE)),
      y: clamp(posRef.current.y, EDGE, Math.max(EDGE, window.innerHeight - h - EDGE)),
    };
    elRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
  }, []);

  useEffect(() => {
    applyPos();
    window.addEventListener('resize', applyPos);
    return () => window.removeEventListener('resize', applyPos);
  }, [applyPos, minimized, height]);

  // Messages from the chess iframe (see games/chess/public/app.js notifyParent)
  useEffect(() => {
    let backendOrigin = '';
    try { backendOrigin = new URL(BASE_URL, window.location.href).origin; } catch { /* ignore */ }

    const onMsg = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (backendOrigin && e.origin !== backendOrigin) return;
      const d = e.data;
      if (!d || typeof d.type !== 'string') return;
      switch (d.type) {
        case 'chess-embed:height':
          if (typeof d.height === 'number') setHeight(clamp(Math.ceil(d.height), 300, window.innerHeight - 120));
          break;
        case 'chess-embed:created':
          setWaiting(true);
          setStatus(`Game #${d.id} · waiting`);
          onCreatedRef.current?.(String(d.id));
          break;
        case 'chess-embed:started':
          setWaiting(false);
          setGameActive(true);
          setStatus(`Game #${d.id} · playing`);
          break;
        case 'chess-embed:over':
          setWaiting(false);
          setGameActive(false);
          setStatus('Game over');
          break;
        default:
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // A game counts as busy while waiting for an opponent or playing
  useEffect(() => { onActiveRef.current?.(gameActive || waiting); }, [gameActive, waiting]);

  const onPointerDown = (e) => {
    if (e.isPrimary === false || e.target.closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      sx: e.clientX, sy: e.clientY,
      ox: posRef.current.x, oy: posRef.current.y,
    };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    posRef.current = {
      x: dragRef.current.ox + e.clientX - dragRef.current.sx,
      y: dragRef.current.oy + e.clientY - dragRef.current.sy,
    };
    applyPos();
  };
  const onPointerUp = () => { dragRef.current = null; };

  const handleClose = () => {
    if (gameActive && !window.confirm('A game is in progress. Closing will forfeit it after 60 seconds. Close anyway?')) return;
    onClose();
  };

  const src =
    `${BASE_URL}/start-chess?embed=1` +
    (username ? `&name=${encodeURIComponent(username)}` : '') +
    (joinCode ? `&join=${encodeURIComponent(joinCode)}` : '');

  return (
    <div
      ref={elRef}
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 110,
        width: minimized ? Math.max(MIN_W, Math.min(260, window.innerWidth - EDGE * 2)) : width(),
        willChange: 'transform',
        transform: `translate(${posRef.current.x}px, ${posRef.current.y}px)`,
      }}
      className="bg-gray-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => setMinimized((m) => !m)}
        style={{ touchAction: 'none', userSelect: 'none' }}
        className="h-11 shrink-0 bg-gray-900 border-b border-white/5 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-white text-sm font-medium truncate">{status}</span>
          {gameActive && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMinimized((m) => !m)}
            aria-label={minimized ? 'Restore chess' : 'Minimize chess'}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-4 h-4" />}
          </button>
          <button
            onClick={handleClose}
            aria-label="Close chess"
            className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stays mounted while minimized so the game keeps running */}
      <iframe
        ref={iframeRef}
        src={src}
        title="Chess"
        allow="clipboard-write; fullscreen"
        style={{ width: '100%', height: minimized ? 0 : height, border: 0, display: 'block' }}
      />
    </div>
  );
};

export default ChessWindow;
