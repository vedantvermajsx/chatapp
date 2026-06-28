import { memo } from 'react';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const TypingIndicator = memo(function TypingIndicator({ avatar, name, label, charCount }) {
  const { theme } = useTheme();
  const { getShadow } = useNeumorphism();

  return (
    <div className="flex items-end gap-3 w-full justify-start animate-fade-in-up">
      <div className="flex-shrink-0">
        {avatar ? (
          <Avatar url={avatar} name={name} size={8} mdSize={8} />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex-shrink-0"
            style={{ backgroundColor: theme.otherMessageBubble, boxShadow: getShadow(theme.isLight, false, 2, 4) }}
          />
        )}
      </div>

      <div
        style={{
          backgroundColor: theme.otherMessageBubble,
          boxShadow: getShadow(theme.isLight, false, 2, 5)
        }}
        className="px-4 py-3 md:px-5 md:py-4 rounded-2xl rounded-bl-none flex items-center gap-2"
      >
        <span className="typing-dots" aria-label={label || 'Typing'} role="status">
          <span style={{ backgroundColor: theme.otherUsernameColor }} />
          <span style={{ backgroundColor: theme.otherUsernameColor }} />
          <span style={{ backgroundColor: theme.otherUsernameColor }} />
        </span>
        {typeof charCount === 'number' && (
          <span className="text-[10px] md:text-xs opacity-70" style={{ color: theme.otherUsernameColor }}>
            {charCount}
          </span>
        )}
      </div>
    </div>
  );
});

export default TypingIndicator;
