import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import ProgressLoader from './ProgressLoader';

function MediaContent({ msg, isOwn, theme }) {
  const [showMedia, setShowMedia] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);

  const shouldAutoRender = (msg.media?.type === 'image' || msg.media?.type === 'gif');
  const isGif = msg.media?.url?.toLowerCase().endsWith('.gif');
  const mediaDisplayUrl = msg.media?.url;
  const thumbnailUrl = msg.media?.thumbnail || msg.media?.low || msg.media?.url;

  return (
    <div className="mt-1 relative">
      {msg?.media.isPending && (
        <ProgressLoader progress={msg.uploadProgress || 0} />
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
            onClick={() => window.dispatchEvent(new CustomEvent('openImageZoom', { detail: { url: mediaDisplayUrl, media: msg.media } }))}
            loading="lazy"
            onLoad={() => setMediaLoaded(true)}
          />
        </div>
      )}

      {msg.media.type === 'video' && (
        <div
          className="relative cursor-pointer"
          onClick={() => window.open(msg.media.url, '_blank', 'noopener,noreferrer')}
        >
          <video
            src={msg.media.url}
            controls
            className="rounded-lg max-h-48 md:max-h-64 w-full"
          />
        </div>
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
            onClick={() => window.dispatchEvent(new CustomEvent('openImageZoom', { detail: { url: mediaDisplayUrl, media: msg.media } }))}
            loading="lazy"
            onLoad={() => setMediaLoaded(true)}
          />
        </div>
      )}
    </div>
  );
}

export default MediaContent;
