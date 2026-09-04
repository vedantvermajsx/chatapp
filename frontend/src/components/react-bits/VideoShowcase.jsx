import { useRef, useState } from 'react';
import { Play } from 'lucide-react';

function VideoShowcase({ src = '/demo.mp4', poster = '/demo-poster.jpg', className = '' }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    videoRef.current?.play();
    setPlaying(true);
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border bg-secondary/40 ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={playing}
        playsInline
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="w-full aspect-video object-cover bg-neutral-900"
      />
      {!playing && (
        <button
          onClick={handlePlay}
          aria-label="Play demo video"
          className="absolute inset-0 flex items-center justify-center group"
        >
          <span className="absolute inset-0 bg-neutral-900/10 group-hover:bg-neutral-900/15 transition-colors" />
          <span className="relative w-14 h-14 rounded-full bg-white/95 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <Play className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}

export default VideoShowcase;
