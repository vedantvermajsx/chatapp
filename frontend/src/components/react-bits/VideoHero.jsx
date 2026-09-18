import { useEffect, useRef, useState } from 'react';

function VideoHero({ poster = '/demo-poster.jpg', className = '', sectionRef, children }) {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  // Cursor-lean parallax on the video layer only — the same "living
  // key-art" feel as the marketing site's hero, kept subtle so it never
  // fights with the headline copy sitting on top.
  useEffect(() => {
    const section = sectionRef?.current;
    const video = videoRef.current;
    if (!section || !video) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    let ticking = false;
    const onMove = (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const bounds = section.getBoundingClientRect();
        const nx = (e.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2);
        const ny = (e.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2);
        video.style.transform = `scale(1.08) translate3d(${nx * -10}px, ${ny * -6}px, 0)`;
        ticking = false;
      });
    };
    const onLeave = () => {
      video.style.transform = 'scale(1.08) translate3d(0, 0, 0)';
    };

    section.addEventListener('mousemove', onMove, { passive: true });
    section.addEventListener('mouseleave', onLeave);
    return () => {
      section.removeEventListener('mousemove', onMove);
      section.removeEventListener('mouseleave', onLeave);
    };
  }, [sectionRef]);

  return (
    <section ref={sectionRef} className={`relative w-full overflow-hidden ${className}`}>
      <div ref={wrapRef} className="absolute inset-0 hero-video-ambient">
        <video
          ref={videoRef}
          src={'https://res.cloudinary.com/druwykigf/video/upload/v1788528931/video.mp4'}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scale(1.08)', transition: 'transform 0.4s ease-out' }}
        />
      </div>

      {/* Forest-green colour wash, matching the rest of the brand, plus
          a cinematic vignette on top of the plain darkening gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f2419]/60 via-[#0d1a14]/35 to-[#081109]/70" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_15%_0%,rgba(22,163,74,0.28),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_30%,transparent_45%,rgba(3,8,5,0.5)_100%)]" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        {children}
      </div>
    </section>
  );
}

export default VideoHero;
