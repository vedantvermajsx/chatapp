import { memo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

const TypingIndicator = memo(function TypingIndicator({ name, label, charCount }) {
  const { theme } = useTheme();
  const muted = theme.isLight ? '#4b5563' : '#a1a1aa';

  return (
    <div className="flex items-center gap-2 px-4 pt-2 h-6 text-xs" role="status" aria-live="polite">
      <span className="typing-dots" aria-hidden="true">
        <span style={{ backgroundColor: theme.otherMessageText }} />
        <span style={{ backgroundColor: theme.otherMessageText }} />
        <span style={{ backgroundColor: theme.otherMessageText }} />
      </span>
      <span style={{ color: muted }}>
        <strong style={{ color: theme.otherMessageText }}>{name || 'Someone'}</strong> is typing
        {typeof charCount === 'number' ? ` · ${charCount}` : ''}
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
});

export default TypingIndicator;
