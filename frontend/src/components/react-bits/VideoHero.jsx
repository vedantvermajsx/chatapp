import { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

function VideoHero({ poster = '/demo-poster.jpg', className = '', sectionRef, children }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  return (
    <section ref={sectionRef} className={`relative w-full overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={'https://res.cloudinary.com/druwykigf/video/upload/v1788528931/video.mp4'}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/55" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        {children}
      </div>
    </section>
  );
}

export default VideoHero;
