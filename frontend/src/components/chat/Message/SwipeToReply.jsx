import { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Reply } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const SWIPE_TRIGGER = 56;
const MAX_SWIPE = 76;

// Touch/pointer equivalent of the RN PanResponder-based SwipeToReply.
// Wraps a message row; swiping past SWIPE_TRIGGER fires onReply, mirroring
// RN's swipe-to-reply gesture (swipe right on others' messages, left on your own).
export default function SwipeToReply({ children, onReply, disabled, isOwn }) {
  const { theme } = useTheme();
  const x = useMotionValue(0);
  const iconOpacity = useTransform(x, (v) => Math.min(1, Math.abs(v) / SWIPE_TRIGGER));
  const triggeredRef = useRef(false);

  if (disabled) {
    return <div className="w-full">{children}</div>;
  }

  const dragConstraints = isOwn ? { left: -MAX_SWIPE, right: 0 } : { left: 0, right: MAX_SWIPE };

  const handleDrag = (_, info) => {
    if (!triggeredRef.current && Math.abs(info.offset.x) >= SWIPE_TRIGGER) {
      triggeredRef.current = true;
    }
  };

  const handleDragEnd = (_, info) => {
    if (Math.abs(info.offset.x) >= SWIPE_TRIGGER) {
      onReply?.();
    }
    triggeredRef.current = false;
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
  };

  return (
    <div className="relative w-full">
      <motion.div
        aria-hidden="true"
        className="absolute top-0 bottom-0 flex items-center pointer-events-none"
        style={{ opacity: iconOpacity, [isOwn ? 'right' : 'left']: 8 }}
      >
        <div
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
          style={{ backgroundColor: theme.isLight ? '#e5e7eb' : '#374151' }}
        >
          <Reply className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragElastic={0.15}
        dragMomentum={false}
        dragConstraints={dragConstraints}
        style={{ x, touchAction: 'pan-y' }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
