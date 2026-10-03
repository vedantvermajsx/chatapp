import { memo } from 'react';
import { Reply, CornerUpRight } from 'lucide-react';
import LoaderMini from '../../common/Loader';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatSeenAt, formatMessageTime } from '../../../utils/dateUtils';
import StickerMessage from './StickerMessage';
import MediaContent from './MediaContent';
import TextContent, { isEmojiOnly } from './TextContent';

const REPLY_MEDIA_LABELS = { image: 'Photo', video: 'Video', audio: 'Voice message', sticker: 'Sticker', gif: 'GIF' };

const Message = memo(function Message({ msg, isOwn, senderAvatar = null, gender = null, isOnline, lastSeen, isPrivateChat = false, progress = 0, isTagged = false, grouped = false, onReplyClick, onReplyQuoteClick }) {
  const { theme } = useTheme();

  if (msg?.media?.type === 'sticker') {
    return (
      <StickerMessage msg={msg} isOwn={isOwn} senderAvatar={senderAvatar} isOnline={isOnline} lastSeen={lastSeen} isPrivateChat={isPrivateChat} grouped={grouped} />
    );
  }

  const bubbleBg = isOwn ? theme.myMessageBubble : theme.otherMessageBubble;
  const bubbleText = isOwn ? theme.myMessageText : theme.otherMessageText;
  const muted = isOwn
    ? (theme.isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)')
    : (theme.isLight ? '#4b5563' : '#a1a1aa');
  const outerMuted = theme.isLight ? '#4b5563' : '#a1a1aa';

  const replyTo = msg.replyTo;
  const replyMediaLabel = replyTo?.media ? REPLY_MEDIA_LABELS[replyTo.media.type] || 'Attachment' : null;
  const time = formatMessageTime(msg.timestamp);
  const showName = !isOwn && !isPrivateChat && (!grouped || !!replyTo);
  const showAvatar = !isOwn && (!grouped || !!replyTo);
  const emojiOnly = !msg.media && !replyTo && isEmojiOnly(msg.text);
  const hasBubble = !emojiOnly;

  return (
    <article
      className={`msg-row group relative flex items-end gap-2 w-full px-3 sm:px-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      style={{
        marginTop: grouped && !replyTo ? 2 : 10,
        opacity: msg.isPending ? 0.6 : 1,
        backgroundColor: isTagged ? 'rgba(250,166,26,0.10)' : undefined,
      }}
      aria-label={`${msg.username || 'Message'}, ${time}`}
    >
      {!isOwn && (
        <div className="w-8 flex-shrink-0 self-start">
          {showAvatar && (
            <button
              type="button"
              className={senderAvatar ? 'cursor-pointer' : 'cursor-default'}
              tabIndex={senderAvatar ? 0 : -1}
              aria-label={`View ${msg.username}'s photo`}
              onClick={() => {
                if (senderAvatar) {
                  window.dispatchEvent(new CustomEvent('openImageZoom', { detail: { url: senderAvatar.replace('w_50,h_50,c_fill', 'w_500,h_500,c_fill') } }));
                }
              }}
            >
              <Avatar url={senderAvatar} name={msg.username} size={8} mdSize={8} />
            </button>
          )}
        </div>
      )}

      <div className={`flex flex-col min-w-0 max-w-[80%] md:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showName && (
          <span className="font-semibold text-[12px] truncate max-w-full mb-0.5 px-1" style={{ color: theme.otherUsernameColor }}>
            {msg?.username?.length > 20 ? `${msg.username.substring(0, 20)}…` : msg?.username}
          </span>
        )}

        <div
          className={hasBubble ? 'rounded-2xl px-3 py-2 min-w-0 max-w-full' : 'min-w-0 max-w-full'}
          style={hasBubble ? {
            backgroundColor: bubbleBg,
            color: bubbleText,
            borderBottomRightRadius: isOwn ? 6 : undefined,
            borderBottomLeftRadius: !isOwn ? 6 : undefined,
            border: isTagged ? '1px solid #faa61a' : undefined,
          } : undefined}
        >
          {replyTo && (
            <button
              type="button"
              onClick={() => onReplyQuoteClick?.(replyTo)}
              className="flex items-center gap-1.5 max-w-full text-left text-xs mb-1.5 px-2 py-1 rounded-md hover:opacity-80"
              style={{ backgroundColor: isOwn ? 'rgba(128,128,128,0.25)' : 'rgba(128,128,128,0.15)', borderLeft: `3px solid ${isOwn ? bubbleText : theme.otherUsernameColor}` }}
              aria-label={`Replying to ${replyTo.username || 'unknown user'}. Jump to message`}
            >
              <CornerUpRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: muted }} aria-hidden="true" />
              <span className="font-semibold flex-shrink-0">@{replyTo.username || 'Unknown'}</span>
              <span className="truncate" style={{ color: muted }}>{replyMediaLabel || replyTo.text || 'Message'}</span>
            </button>
          )}

          {msg?.media && <div className="mb-1"><MediaContent msg={msg} isOwn={isOwn} theme={theme} /></div>}

          <TextContent text={msg?.text} textColor={bubbleText} bubbleBg={bubbleBg} accent={isOwn ? bubbleText : theme.myMessageBubble} isOwn={isOwn} />

          {hasBubble && (
            <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
              <time className="text-[10px] whitespace-nowrap" style={{ color: muted }}>{time}</time>
              {msg.isPending && <LoaderMini className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: muted }} aria-label="Sending" />}
            </div>
          )}
        </div>

        {emojiOnly && (
          <div className="flex items-center gap-1 px-1">
            <time className="text-[10px]" style={{ color: outerMuted }}>{time}</time>
            {msg.isPending && <LoaderMini className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: outerMuted }} aria-label="Sending" />}
          </div>
        )}

        {isOwn && !msg.isPending && isPrivateChat && msg.isSeen && (
          <p className="text-[11px] mt-0.5 px-1" style={{ color: outerMuted }}>{formatSeenAt(msg.seenAt)}</p>
        )}
      </div>

      {!msg.isPending && (
        <div className="msg-tools self-center opacity-0 transition-opacity flex flex-shrink-0">
          <button
            type="button"
            onClick={() => onReplyClick?.(msg)}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            aria-label={`Reply to ${msg.username || 'message'}`}
            title="Reply"
          >
            <Reply className="w-4 h-4" style={{ color: outerMuted }} aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
});

export default Message;
