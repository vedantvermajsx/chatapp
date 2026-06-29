import { memo } from 'react';
import { Loader } from 'lucide-react';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatSeenAt, formatMessageTime } from '../../../utils/dateUtils';

const StickerMessage = memo(function StickerMessage({ msg, isOwn, senderAvatar = null, isOnline, lastSeen, isPrivateChat = false }) {
  const { theme } = useTheme();

  return (
    <div className={`group relative flex items-end gap-3 w-full ${isOwn ? 'flex-row-reverse' : 'justify-start'} animate-fade-in-up`}>
      <div className="flex-shrink-0">
        <Avatar url={senderAvatar} name={msg.username} size={8} mdSize={8} isOnline={isOnline} lastSeen={lastSeen} />
      </div>
      
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isPrivateChat && !msg.isOwn && (
          <p className="text-[10px] md:text-xs mb-1 font-semibold" style={{ color: isOwn ? theme.myUsernameColor : theme.otherUsernameColor }}>
            {msg?.username?.length > 15 ? msg?.username.substring(0, 15) : msg?.username}
          </p>
        )}
        <div className="relative">
          <img
            src={msg.media.url}
            alt="sticker"
            className="w-28 h-28 md:w-36 md:h-36 object-contain"
            style={{ opacity: msg.isPending ? 0.5 : 1 }}
            loading="lazy"
          />
          {msg.isPending && (
            <Loader className="absolute bottom-1 right-1 w-3 h-3 animate-spin" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af' }} />
          )}
        </div>
        
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 flex items-center gap-1`}>
          <p className="text-[10px] font-medium" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af' }}>
            {formatMessageTime(msg.timestamp)}
          </p>
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
