import { useRef, useCallback, useEffect } from 'react';
import { Maximize2, Mic, MicOff, PhoneOff } from 'lucide-react';
import CallContent from './CallContent';

const MINIMIZED_W = 160;
const MINIMIZED_H = 240;
const EDGE_PADDING = 12;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const MinimizedView = ({
  target,
  isVideo,
  isConnecting,
  isLost,
  remoteStream,
  localStream,
  remoteVideoRef,
  localVideoRef,
  durationStr,
  isMuted,
  toggleMute,
  endCall,
  toggleMinimize,
}) => {
  const posRef = useRef({
    x: window.innerWidth - MINIMIZED_W - EDGE_PADDING,
    y: window.innerHeight - MINIMIZED_H - EDGE_PADDING,
  });
  const scaleRef = useRef(1);
  const elRef = useRef(null);
  const dragStateRef = useRef(null);
  const pinchStateRef = useRef(null);

  const applyTransform = useCallback(() => {
    if (!elRef.current) return;
    const { x, y } = posRef.current;
    elRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scaleRef.current})`;
  }, []);

  useEffect(() => {
    const onResize = () => {
      const maxX = window.innerWidth - MINIMIZED_W - EDGE_PADDING;
      const maxY = window.innerHeight - MINIMIZED_H - EDGE_PADDING;
      posRef.current = {
        x: clamp(posRef.current.x, EDGE_PADDING, maxX),
        y: clamp(posRef.current.y, EDGE_PADDING, maxY),
      };
      applyTransform();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [applyTransform]);

  useEffect(() => { applyTransform(); }, [applyTransform]);

  const onPointerDown = useCallback((e) => {
    if (e.isPrimary === false || e.target.closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      startX: e.clientX, startY: e.clientY,
      originX: posRef.current.x, originY: posRef.current.y,
    };
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragStateRef.current) return;
    if (pinchStateRef.current) { dragStateRef.current = null; return; }
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    posRef.current = {
      x: clamp(dragStateRef.current.originX + dx, EDGE_PADDING, window.innerWidth - MINIMIZED_W - EDGE_PADDING),
      y: clamp(dragStateRef.current.originY + dy, EDGE_PADDING, window.innerHeight - MINIMIZED_H - EDGE_PADDING),
    };
    applyTransform();
  }, [applyTransform]);

  const onPointerUp = useCallback(() => { dragStateRef.current = null; }, []);

  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      pinchStateRef.current = { startDist: getTouchDist(e.touches), startScale: scaleRef.current };
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchStateRef.current) {
      e.preventDefault();
      scaleRef.current = clamp(
        pinchStateRef.current.startScale * (getTouchDist(e.touches) / pinchStateRef.current.startDist),
        0.5, 2
      );
      applyTransform();
    }
  }, [applyTransform]);

  const onTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) pinchStateRef.current = null;
  }, []);

  return (
    <div
      ref={elRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onDoubleClick={toggleMinimize}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: MINIMIZED_W, height: MINIMIZED_H,
        zIndex: 100, willChange: 'transform',
        touchAction: 'none', userSelect: 'none',
        transformOrigin: 'top left',
      }}
      className="bg-gray-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10 hover:border-white/20 transition-[border-color] cursor-grab active:cursor-grabbing"
    >
      <div className="absolute top-2 right-2 z-30 p-1 bg-black/50 rounded-full text-white/70 pointer-events-none">
        <Maximize2 className="w-4 h-4" />
      </div>

      <CallContent
        isVideo={isVideo}
        isConnecting={isConnecting}
        isMinimized
        isLost={isLost}
        remoteStream={remoteStream}
        localStream={localStream}
        remoteVideoRef={remoteVideoRef}
        localVideoRef={localVideoRef}
        target={target}
        durationStr={durationStr}
      />

      <div className="h-14 shrink-0 bg-gray-900 border-t border-white/5 flex items-center justify-between px-4">
        <div className="flex flex-col justify-center max-w-[50%] overflow-hidden pointer-events-none">
          <p className="text-white text-sm font-medium truncate">{target?.username}</p>
          <p className="text-white/50 text-xs truncate">
            {isConnecting ? 'Calling...' : isVideo ? `Video · ${durationStr}` : `Audio · ${durationStr}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/35' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); endCall(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinimizedView;
