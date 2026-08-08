import { memo } from 'react';
import { Loader, Reply } from 'lucide-react';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatSeenAt, formatMessageTime } from '../../../utils/dateUtils';
import StickerMessage from './StickerMessage';
import MediaContent from './MediaContent';
import TextContent from './TextContent';

const REPLY_MEDIA_LABELS = { image: 'Photo', video: 'Video', audio: 'Voice message', sticker: 'Sticker', gif: 'GIF' };

const Message = memo(function Message({ msg, isOwn, senderAvatar = null, gender = null, isOnline, lastSeen, isPrivateChat = false, progress = 0, isTagged = false, onReplyClick, onReplyQuoteClick }) {
  const { theme } = useTheme();

  const bubbleBg = isOwn
    ? (msg.isPending ? `${theme.myMessageBubble}CC` : theme.myMessageBubble)
    : theme.otherMessageBubble;
  const textColor = isOwn
    ? (msg.isPending ? `${theme.myMessageText}CC` : theme.myMessageText)
    : theme.otherMessageText;
  const usernameColor = isOwn
    ? (msg.isPending ? `${theme.myUsernameColor}CC` : theme.myUsernameColor)
    : theme.otherUsernameColor;

  const replyTo = msg.replyTo;
  const replyMediaLabel = replyTo?.media ? REPLY_MEDIA_LABELS[replyTo.media.type] || 'Attachment' : null;

  if (msg?.media?.type === 'sticker') {
    return (
      <StickerMessage
        msg={msg}
        isOwn={isOwn}
        senderAvatar={senderAvatar}
        isOnline={isOnline}
        lastSeen={lastSeen}
        isPrivateChat={isPrivateChat}
      />
    );
  }

  return (
    <div className={`group relative flex items-end gap-3 w-full ${isOwn ? 'flex-row-reverse' : 'justify-start'} animate-fade-in-up`}>

      <div
        className={`flex-shrink-0 ${!isOwn ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (!isOwn && senderAvatar) {
            window.dispatchEvent(new CustomEvent('openImageZoom', { detail: { url: senderAvatar.replace('w_50,h_50,c_fill', 'w_500,h_500,c_fill') } }));
          }
        }}
      >
        <Avatar url={senderAvatar} name={msg.username} size={8} mdSize={8} />
      </div>

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          style={{
            backgroundColor: bubbleBg,
            color: textColor,
            border: isTagged ? `2px solid yellow` : 'none'
          }}
          className={`max-w-[280px] md:max-w-sm lg:max-w-md px-3.5 py-2 md:px-4 md:py-2.5 rounded-[22px] transition-all duration-300 ${isOwn ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'} relative flex flex-col`}
        >

          {!isPrivateChat && !msg.isOwn && (
            <p className="text-[11px] md:text-xs mb-1 font-bold tracking-wide" style={{ color: usernameColor }}>
              {msg?.username?.length > 15 ? msg?.username.substring(0, 15) : msg?.username}
            </p>
          )}

          {replyTo && (
            <button
              type="button"
              onClick={() => onReplyQuoteClick?.(replyTo)}
              className="w-full text-left mb-1.5 px-2 py-1 rounded-lg border-l-2 truncate"
              style={{
                backgroundColor: isOwn ? 'rgba(0,0,0,0.12)' : (theme.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)'),
                borderLeftColor: usernameColor,
              }}
            >
              <p className="text-[11px] font-bold truncate" style={{ color: usernameColor }}>
                {replyTo.username || 'Unknown'}
              </p>
              <p className="text-[11px] truncate" style={{ color: textColor, opacity: 0.85 }}>
                {replyMediaLabel || replyTo.text || 'Message'}
              </p>
            </button>
          )}

          {msg?.media && (
            <MediaContent msg={msg} isOwn={isOwn} theme={theme} />
          )}

          <TextContent text={msg?.text} textColor={textColor} bubbleBg={bubbleBg} />

        </div>

        <div className={`flex items-center gap-2 h-0 overflow-visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] font-medium whitespace-nowrap mt-2" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af' }}>
            {formatMessageTime(msg.timestamp)}
          </span>
          {msg.isPending && (
            <Loader className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af' }} />
          )}
          {!msg.isPending && (
            <button
              type="button"
              onClick={() => onReplyClick?.(msg)}
              className="mt-2 p-0.5 rounded-full hover:bg-black/10"
              title="Reply"
            >
              <Reply className="w-3 h-3" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af' }} />
            </button>
          )}
        </div>
      </div>

      {
        isOwn && !msg.isPending && isPrivateChat && msg.isSeen && (
          <p className="text-[10px] " style={{ color: theme.isLight ? '#4b5563' : '#9ca3af', opacity: 0.9 }}>
            {formatSeenAt(msg.seenAt)}
          </p>
        )
      }

    </div>
  );
});

export default Message;
