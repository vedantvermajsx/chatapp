import { memo } from 'react';
import { Reply, CornerUpRight } from 'lucide-react';
import LoaderMini from '../../common/Loader';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatSeenAt, formatMessageTime } from '../../../utils/dateUtils';
import StickerMessage from './StickerMessage';
import MediaContent from './MediaContent';
import TextContent from './TextContent';

const REPLY_MEDIA_LABELS = { image: 'Photo', video: 'Video', audio: 'Voice message', sticker: 'Sticker', gif: 'GIF' };

const Message = memo(function Message({ msg, isOwn, senderAvatar = null, gender = null, isOnline, lastSeen, isPrivateChat = false, progress = 0, isTagged = false, grouped = false, onReplyClick, onReplyQuoteClick }) {
  const { theme } = useTheme();

  const text = theme.otherMessageText;
  const muted = theme.isLight ? '#4b5563' : '#a1a1aa';
  const hover = theme.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
  const accent = theme.myMessageBubble;
  const nameColor = isOwn ? text : theme.otherUsernameColor;
  const replyTo = msg.replyTo;
  const replyMediaLabel = replyTo?.media ? REPLY_MEDIA_LABELS[replyTo.media.type] || 'Attachment' : null;
  const time = formatMessageTime(msg.timestamp);
  const showHeader = !grouped || !!replyTo;

  if (msg?.media?.type === 'sticker') {
    return (
      <StickerMessage msg={msg} isOwn={isOwn} senderAvatar={senderAvatar} isOnline={isOnline} lastSeen={lastSeen} isPrivateChat={isPrivateChat} />
    );
  }

  return (
    <article
      className="msg-row group relative flex gap-4 w-full px-4 py-0.5 rounded-md"
      style={{
        '--msg-hover': hover,
        marginTop: showHeader ? 12 : 0,
        opacity: msg.isPending ? 0.6 : 1,
        boxShadow: isTagged ? `inset 3px 0 0 #faa61a` : 'none',
        backgroundColor: isTagged ? 'rgba(250,166,26,0.10)' : undefined,
      }}
      aria-label={`${msg.username || 'Message'}, ${time}`}
    >
      {/* Avatar gutter (40px) */}
      <div className="w-10 flex-shrink-0 pt-0.5">
        {showHeader ? (
          <button
            type="button"
            className={isOwn ? 'cursor-default' : 'cursor-pointer'}
            tabIndex={isOwn || !senderAvatar ? -1 : 0}
            aria-label={isOwn ? undefined : `View ${msg.username}'s photo`}
            onClick={() => {
              if (!isOwn && senderAvatar) {
                window.dispatchEvent(new CustomEvent('openImageZoom', { detail: { url: senderAvatar.replace('w_50,h_50,c_fill', 'w_500,h_500,c_fill') } }));
              }
            }}
          >
            <Avatar url={senderAvatar} name={msg.username} size={10} mdSize={10} />
          </button>
        ) : (
          <span className="msg-gutter-time opacity-0 block text-[10px] text-right leading-[22px] whitespace-nowrap" style={{ color: muted }}>
            {time}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {replyTo && (
          <button
            type="button"
            onClick={() => onReplyQuoteClick?.(replyTo)}
            className="flex items-center gap-1.5 max-w-full text-left text-xs mb-0.5 hover:underline"
            aria-label={`Replying to ${replyTo.username || 'unknown user'}. Jump to message`}
          >
            <CornerUpRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: muted }} aria-hidden="true" />
            <span className="font-semibold flex-shrink-0" style={{ color: theme.otherUsernameColor }}>
              @{replyTo.username || 'Unknown'}
            </span>
            <span className="truncate" style={{ color: muted }}>
              {replyMediaLabel || replyTo.text || 'Message'}
            </span>
          </button>
        )}

        {showHeader && (
          <div className="flex items-baseline gap-2 leading-snug">
            <span className="font-semibold text-[15px] truncate" style={{ color: nameColor }}>
              {msg?.username?.length > 20 ? `${msg.username.substring(0, 20)}…` : msg?.username}
            </span>
            <time className="text-[11px] whitespace-nowrap" style={{ color: muted }}>{time}</time>
            {msg.isPending && <LoaderMini className="w-3 h-3 animate-spin flex-shrink-0 self-center" style={{ color: muted }} aria-label="Sending" />}
          </div>
        )}

        {msg?.media && <div className="mt-1"><MediaContent msg={msg} isOwn={false} theme={theme} /></div>}

        <TextContent text={msg?.text} textColor={text} bubbleBg={theme.background} accent={accent} isOwn={isOwn} />

        {isOwn && !msg.isPending && isPrivateChat && msg.isSeen && (
          <p className="text-[11px] mt-0.5" style={{ color: muted }}>{formatSeenAt(msg.seenAt)}</p>
        )}
      </div>

      {/* Hover toolbar */}
      {!msg.isPending && (
        <div
          className="msg-tools absolute -top-3 right-4 opacity-0 transition-opacity rounded-md flex"
          style={{
            backgroundColor: theme.background,
            border: `1px solid ${theme.isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
          }}
        >
          <button
            type="button"
            onClick={() => onReplyClick?.(msg)}
            className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10"
            aria-label={`Reply to ${msg.username || 'message'}`}
            title="Reply"
          >
            <Reply className="w-4 h-4" style={{ color: muted }} aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
});

export default Message;
