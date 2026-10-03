import { memo } from 'react';
import LoaderMini from '../../common/Loader';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatSeenAt, formatMessageTime } from '../../../utils/dateUtils';

const StickerMessage = memo(function StickerMessage({ msg, isOwn, senderAvatar = null, isOnline, lastSeen, isPrivateChat = false, grouped = false }) {
  const { theme } = useTheme();
  const muted = theme.isLight ? '#4b5563' : '#a1a1aa';

  return (
    <div className={`group relative flex items-end gap-2 w-full px-3 sm:px-4 animate-fade-in-up ${isOwn ? 'flex-row-reverse' : 'flex-row'}`} style={{ marginTop: grouped ? 2 : 10 }}>
      {!isOwn && (
        <div className="w-8 flex-shrink-0 self-start">
          {!grouped && <Avatar url={senderAvatar} name={msg.username} size={8} mdSize={8} isOnline={isOnline} lastSeen={lastSeen} />}
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && !isPrivateChat && !grouped && (
          <span className="font-semibold text-[12px] mb-0.5 px-1" style={{ color: theme.otherUsernameColor }}>{msg?.username}</span>
        )}
        <div className="relative">
          <img
            src={msg.media.url}
            alt={`Sticker from ${msg.username}`}
            className="w-28 h-28 md:w-36 md:h-36 object-contain"
            style={{ opacity: msg.isPending ? 0.5 : 1 }}
            loading="lazy"
          />
          {msg.isPending && <LoaderMini className="absolute bottom-1 right-1 w-3 h-3 animate-spin" style={{ color: muted }} />}
        </div>
        <div className="flex items-center gap-1 px-1">
          <time className="text-[10px]" style={{ color: muted }}>{formatMessageTime(msg.timestamp)}</time>
          {isOwn && !msg.isPending && isPrivateChat && msg.isSeen && (
            <span className="text-[10px]" style={{ color: muted }}>· {formatSeenAt(msg.seenAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default StickerMessage;
