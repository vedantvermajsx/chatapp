import { useState, memo } from 'react';
import { Play, Loader2 } from 'lucide-react';
import Avatar from '../../common/Avatar';
import AudioPlayer from './AudioPlayer';
import { useTheme } from '../../../contexts/ThemeContext';

const Message = memo(function Message({ msg, isOwn, senderAvatar = null, gender = null, isOnline, lastSeen }) {
  const { theme } = useTheme();

  const [showMedia, setShowMedia] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const shouldAutoRender = (msg.media?.type === 'image' || msg.media?.type === 'gif');

  const isGif = msg.media?.url?.toLowerCase().endsWith('.gif');

  let thumbnailUrl = msg.media?.url;
  if (isGif && thumbnailUrl && thumbnailUrl.includes('res.cloudinary.com')) {
    thumbnailUrl = thumbnailUrl.replace('/upload/', '/upload/f_jpg/');
  }

  const mediaDisplayUrl = msg.media?.type === 'image' ? thumbnailUrl || msg.media?.url : msg.media?.url;

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-6">
        <span
          className="text-xs px-6 py-3 rounded-2xl font-semibold"
          style={{
            backgroundColor: theme.isLight ? '#fee2e2' : '#7f1d1d',
            color: theme.isLight ? '#991b1b' : '#fee2e2',
            boxShadow: theme.isLight
              ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
              : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
          }}
        >
          {msg.text}
        </span>
      </div>
    );
  }

  const bubbleBg = isOwn
    ? (msg.isPending ? `${theme.myMessageBubble}CC` : theme.myMessageBubble)
    : theme.otherMessageBubble;
  const textColor = isOwn
    ? (msg.isPending ? `${theme.myMessageText}CC` : theme.myMessageText)
    : theme.otherMessageText;
  const usernameColor = isOwn
    ? (msg.isPending ? `${theme.myUsernameColor}CC` : theme.myUsernameColor)
    : theme.otherUsernameColor;

  return (
    <div className={`flex items-end gap-3 w-full ${isOwn ? 'flex-row-reverse' : 'justify-start'} animate-fade-in-up`}>
      {msg.isPending && (
        <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin flex-shrink-0" style={{ color: textColor }} />
      )}
      <div className="flex-shrink-0">
        <Avatar url={senderAvatar} name={msg.username} size={8} mdSize={10} isOnline={isOnline} lastSeen={lastSeen} />
      </div>

      <div
        style={{
          backgroundColor: bubbleBg,
          color: textColor,
          boxShadow: theme.isLight
            ? '1px 1px 4px rgba(0,0,0,0.1), -1px -1px 4px rgba(255,255,255,0.8)'
            : '1px 1px 4px rgba(0,0,0,0.4), -1px -1px 4px rgba(255,255,255,0.05)'
        }}
        className={`max-w-[280px] md:max-w-sm lg:max-w-md px-4 py-3 md:px-6 md:py-4 rounded-2xl transition-all duration-300 ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}`}
      >
        <p className="text-[10px] md:text-xs mb-1 md:mb-2 font-semibold" style={{ color: usernameColor }}>
          {msg.username.length > 15 ? msg.username.substring(0, 15) : msg.username}
        </p>

        {msg.text && <p className="text-xs md:text-sm break-words whitespace-normal mb-2 md:mb-3" style={{ color: textColor }}>{msg.text}</p>}

        {msg.media && (
          <div className="mt-2">
            {msg.media.isPending && (
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af' }} />
                <span className="text-xs" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af' }}>Uploading...</span>
              </div>
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
                  src={mediaDisplayUrl}
                  alt="media"
                  className={`object-contain w-full max-h-48 md:max-h-64 cursor-pointer hover:opacity-90 transition ${!mediaLoaded ? 'opacity-0 absolute inset-0' : 'block rounded-lg opacity-100'}`}
                  onClick={() => window.dispatchEvent(new CustomEvent('openImageZoom', { detail: { url: msg.media.url } }))}
                  loading="lazy"
                  onLoad={() => setMediaLoaded(true)}
                />
              </div>
            )}

            {msg.media.type === 'video' && !showMedia && (
              <button
                onClick={() => setShowMedia(true)}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:opacity-80 transition text-sm"
                style={{
                  backgroundColor: theme.myMessageBubble,
                  color: theme.myMessageText
                }}
              >
                <Play className="w-3 h-3 md:w-4 md:h-4" />
                Load Video
              </button>
            )}

            {msg.media.type === 'video' && showMedia && (
              <video
                src={msg.media.url}
                controls
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
                  src={mediaDisplayUrl}
                  alt="media"
                  className={`object-contain w-full max-h-48 md:max-h-64 cursor-pointer hover:opacity-90 transition ${!mediaLoaded ? 'opacity-0 absolute inset-0' : 'block rounded-lg opacity-100'}`}
                  onClick={() => window.dispatchEvent(new CustomEvent('openImageZoom', { detail: { url: msg.media.url } }))}
                  loading="lazy"
                  onLoad={() => setMediaLoaded(true)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default Message;