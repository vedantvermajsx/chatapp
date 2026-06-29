import { useState, memo } from 'react';
import { Play, Loader2, Send, Loader } from 'lucide-react';
import Avatar from '../../common/Avatar';
import AudioPlayer from './AudioPlayer';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNeumorphism } from '../../../hooks/useNeumorphism';
import { formatSeenAt, formatMessageTime } from '../../../utils/dateUtils';
import ProgressLoader from './ProgressLoader';

const Message = memo(function Message({ msg, isOwn, senderAvatar = null, gender = null, isOnline, lastSeen, isPrivateChat = false, progress = 0, isTagged = false }) {
  const { theme } = useTheme();
  const { getShadow } = useNeumorphism();

  const [showMedia, setShowMedia] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const shouldAutoRender = (msg.media?.type === 'image' || msg.media?.type === 'gif');

  const isGif = msg.media?.url?.toLowerCase().endsWith('.gif');

  const mediaDisplayUrl = msg.media?.url;
  const thumbnailUrl = msg.media?.thumbnail || msg.media?.low || msg.media?.url;

  const bubbleBg = isOwn
    ? (msg.isPending ? `${theme.myMessageBubble}CC` : theme.myMessageBubble)
    : theme.otherMessageBubble;
  const textColor = isOwn
    ? (msg.isPending ? `${theme.myMessageText}CC` : theme.myMessageText)
    : theme.otherMessageText;
  const usernameColor = isOwn
    ? (msg.isPending ? `${theme.myUsernameColor}CC` : theme.myUsernameColor)
    : theme.otherUsernameColor;


  if (msg?.media?.type === 'sticker') {
    return (
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} w-full`}>
        <div className={`flex items-end gap-3 w-full ${isOwn ? 'flex-row-reverse' : 'justify-start'} animate-fade-in-up`}>
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
                className="w-28 h-28 md:w-36 md:h-36 object-contain hover:scale-105 transition-transform duration-100"
                style={{ opacity: msg.isPending ? 0.5 : 1 }}
                loading="lazy"
              />
              {msg.isPending && (
                <Loader className="absolute bottom-1 right-1 w-3 h-3 animate-spin" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af' }} />
              )}
            </div>
          </div>
        </div>

        {isOwn && !msg.isPending && isPrivateChat && msg.isSeen && (
          <p className="text-[10px] mt-1" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af', opacity: 0.9 }}>
            {formatSeenAt(msg.seenAt)}
          </p>
        )}
        <p className="text-[10px] mt-0.5 opacity-70 font-medium" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af' }}>
          {formatMessageTime(msg.timestamp)}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative flex items-end gap-3 w-full ${isOwn ? 'flex-row-reverse' : 'justify-start'} animate-fade-in-up`}>

      <div className="flex-shrink-0">
        <Avatar url={senderAvatar} name={msg.username} size={8} mdSize={8} />
      </div>

      <div
        style={{
          backgroundColor: bubbleBg,
          color: textColor,
          border: isTagged ? `2px solid ${'yellow'}` : 'none'
        }}
        className={`max-w-[280px] md:max-w-sm lg:max-w-md px-3.5 py-2 md:px-4 md:py-2.5 rounded-[22px] transition-all duration-300 ${isOwn ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'} relative flex flex-col`}
      >

        {!isPrivateChat && !msg.isOwn && (<p className="text-[11px] md:text-xs mb-1 font-bold tracking-wide" style={{ color: usernameColor }}>
          {msg?.username?.length > 15 ? msg?.username.substring(0, 15) : msg?.username}
        </p>)}

        {msg?.media && (
          <div className="mt-1 relative">
            {msg?.media.isPending && (
              <ProgressLoader progress={progress} />
            )}

            {shouldAutoRender && (
              <div
                className={`mt-2 relative flex justify-center rounded-lg max-h-48 md:max-h-64 overflow-hidden ${!mediaLoaded ? 'min-h-[150px] md:min-h-[200px] min-w-[150px] md:min-w-[200px] w-full animate-pulse' : ''}`}
                style={{
                  backgroundColor: theme.isLight ? '#e5e7eb' : '#374151',
                  boxShadow: theme.isLight ? 'inset 0 2px 4px rgba(0,0,0,0.06)' : 'inset 0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {!mediaLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" style={{ color: theme.isLight ? '#9ca3af' : '#6b7280' }} />
                  </div>
                )}
                {isGif && !mediaLoaded && (
                  <img
                    src={thumbnailUrl}
                    alt="Loading GIF..."
                    className="absolute inset-0 object-contain w-full h-full filter blur-[4px] opacity-50"
                  />
                )}
                <img
                  src={thumbnailUrl}
                  alt="media"
                  className={`object-contain w-full max-h-48 md:max-h-64 cursor-pointer hover:opacity-90 transition ${!mediaLoaded ? 'opacity-0 absolute inset-0' : 'block rounded-lg opacity-100'}`}
                  onClick={() => window.dispatchEvent(new CustomEvent('openImageZoom', { detail: { url: mediaDisplayUrl } }))}
                  loading="lazy"
                  onLoad={() => setMediaLoaded(true)}
                />
              </div>
            )}

            {msg.media.type === 'video' && !showMedia && (
              <div
                className="relative cursor-pointer"
                onClick={() => setShowMedia(true)}
              >
                <img
                  src={thumbnailUrl}
                  alt="Video thumbnail"
                  className="rounded-lg max-h-64 w-full object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/60 rounded-full p-3">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            )}

            {msg.media.type === 'video' && showMedia && (
              <video
                src={msg.media.url}
                controls
                autoPlay
                className="rounded-lg max-h-48 md:max-h-64 w-full"
              />
            )}

            {msg.media.type === 'audio' && (
              <AudioPlayer src={msg.media.url} isOwn={isOwn} theme={theme} />
            )}

            {(!shouldAutoRender) && !showMedia && msg.media.type !== 'video' && msg.media.type !== 'audio' && (
              <button
                onClick={() => setShowMedia(true)}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:opacity-80 transition text-sm"
                style={{
                  backgroundColor: theme.myMessageBubble,
                  color: theme.myMessageText
                }}
              >
                Load Media
              </button>
            )}

            {(!shouldAutoRender) && showMedia && msg.media.type !== 'video' && msg.media.type !== 'audio' && (
              <div
                className={`relative flex justify-center rounded-lg max-h-48 md:max-h-64 overflow-hidden mt-2 ${!mediaLoaded ? 'min-h-[150px] md:min-h-[200px] min-w-[150px] md:min-w-[200px] w-full animate-pulse' : ''}`}
                style={{
                  backgroundColor: theme.isLight ? '#e5e7eb' : '#374151',
                  boxShadow: theme.isLight ? 'inset 0 2px 4px rgba(0,0,0,0.06)' : 'inset 0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {!mediaLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" style={{ color: theme.isLight ? '#9ca3af' : '#6b7280' }} />
                  </div>
                )}
                {isGif && !mediaLoaded && (
                  <img
                    src={thumbnailUrl}
                    alt="Loading GIF..."
                    className="absolute inset-0 object-contain w-full h-full filter blur-[4px] opacity-50"
                  />
                )}
                <img
                  src={thumbnailUrl}
                  alt="media"
                  className={`object-contain w-full max-h-48 md:max-h-64 cursor-pointer hover:opacity-90 transition ${!mediaLoaded ? 'opacity-0 absolute inset-0' : 'block rounded-lg opacity-100'}`}
                  onClick={() => window.dispatchEvent(new CustomEvent('openImageZoom', { detail: { url: mediaDisplayUrl } }))}
                  loading="lazy"
                  onLoad={() => setMediaLoaded(true)}
                />
              </div>
            )}
          </div>
        )}



        {msg?.text && (
          <p className="text-[14px] md:text-[15px] leading-snug break-words whitespace-pre-wrap mt-0.5" style={{ color: textColor }}>
            {renderTextWithMentions(msg.text, textColor, bubbleBg)}
          </p>
        )}

        <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
          <span className="text-[9px] font-medium tracking-wide" style={{ color: textColor }}>
            {formatMessageTime(msg.timestamp)}
          </span>
          {msg.isPending && (
            <Loader className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: textColor }} />
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

    </div >
  );
});

const renderTextWithMentions = (text, defaultColor, invertedColor) => {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={i}
          className="font-bold px-1 rounded mx-0.5"
          style={{
            backgroundColor: defaultColor,
            color: invertedColor
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

export default Message;
