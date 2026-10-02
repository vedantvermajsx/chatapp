import { memo } from 'react';
import LoaderMini from '../../common/Loader';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatSeenAt, formatMessageTime } from '../../../utils/dateUtils';

const StickerMessage = memo(function StickerMessage({ msg, isOwn, senderAvatar = null, isOnline, lastSeen, isPrivateChat = false }) {
  const { theme } = useTheme();

  return (
    <div className={`group relative flex gap-4 w-full px-4 mt-3 animate-fade-in-up`}>
      <div className="flex-shrink-0">
        <Avatar url={senderAvatar} name={msg.username} size={10} mdSize={10} isOnline={isOnline} lastSeen={lastSeen} />
      </div>
      
      <div className={`flex flex-col items-start`}>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-[15px]" style={{ color: isOwn ? theme.otherMessageText : theme.otherUsernameColor }}>{msg?.username}</span>
          <time className="text-[11px]" style={{ color: theme.isLight ? '#4b5563' : '#a1a1aa' }}>{formatMessageTime(msg.timestamp)}</time>
        </div>
        <div className="relative">
          <img
            src={msg.media.url}
            alt={`Sticker from ${msg.username}`}
            className="w-28 h-28 md:w-36 md:h-36 object-contain"
            style={{ opacity: msg.isPending ? 0.5 : 1 }}
            loading="lazy"
          />
          {msg.isPending && (
            <LoaderMini className="absolute bottom-1 right-1 w-3 h-3 animate-spin" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af' }} />
          )}
        </div>
        
      </div>

      {isOwn && !msg.isPending && isPrivateChat && msg.isSeen && (
        <p className="text-[10px] " style={{ color: theme.isLight ? '#4b5563' : '#9ca3af', opacity: 0.9 }}>
          {formatSeenAt(msg.seenAt)}
        </p>
      )}
    </div>
  );
});

export default StickerMessage;
