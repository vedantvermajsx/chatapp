import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Play, Pause, Loader2 } from "lucide-react";

const BAR_HEIGHTS = [3, 5, 8, 12, 9, 14, 10, 6, 11, 16, 13, 8, 5, 10, 14, 9, 12, 7, 4, 11, 15, 10, 6, 8, 13, 16, 11, 5, 9, 12, 7, 14, 10, 6];

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const AudioPlayer = memo(function AudioPlayer({ src, isOwn, theme }) {
    const audioRef = useRef(null);
    const rafRef = useRef(null);
    const progressBarRef = useRef(null);
    const waveformRef = useRef(null);
    const timeDisplayRef = useRef(null);
    const durationRef = useRef(0);
    const isPlayingRef = useRef(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [initProgress, setInitProgress] = useState(0);

    const accentColor = isOwn
        ? (theme.isLight ? '#6366f1' : '#818cf8')
        : (theme.isLight ? '#0ea5e9' : '#38bdf8');
    const dimColor = theme.isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)';

    const applyProgress = useCallback((progress, ct) => {
        if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${progress})`;
        }
        if (waveformRef.current) {
            const bars = waveformRef.current.children;
            const total = bars.length;
            for (let i = 0; i < total; i++) {
                bars[i].style.background = (i + 1) / total <= progress ? accentColor : dimColor;
            }
        }
        if (timeDisplayRef.current) {
            timeDisplayRef.current.textContent = formatTime(ct);
        }
    }, [accentColor, dimColor]);

    const startRAF = useCallback(() => {
        const tick = () => {
            const audio = audioRef.current;
            if (!audio || !isPlayingRef.current) return;
            const dur = durationRef.current;
            const ct = audio.currentTime;
            applyProgress(dur > 0 ? ct / dur : 0, ct);
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [applyProgress]);

    const stopRAF = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlayingRef.current) {
            audio.pause();
        } else {
            setIsLoading(true);
            audio.play().catch(() => setIsLoading(false));
        }
    }, []);

    const handleSeek = useCallback((e) => {
        const audio = audioRef.current;
        const dur = durationRef.current;
        if (!audio || !dur) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = ratio * dur;
        setInitProgress(ratio);
        applyProgress(ratio, ratio * dur);
    }, [applyProgress]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => {
            setIsPlaying(true);
            setIsLoading(false);
            isPlayingRef.current = true;
            startRAF();
        };
        const onPause = () => {
            setIsPlaying(false);
            isPlayingRef.current = false;
            stopRAF();
        };
        const onEnded = () => {
            setIsPlaying(false);
            isPlayingRef.current = false;
            stopRAF();
            setInitProgress(0);
            applyProgress(0, durationRef.current);
            if (timeDisplayRef.current) {
                timeDisplayRef.current.textContent = formatTime(durationRef.current);
            }
        };
        const onMeta = () => {
            durationRef.current = audio.duration;
            setDuration(audio.duration);
        };
        const onWait = () => setIsLoading(true);
        const onCanPlay = () => setIsLoading(false);

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('loadedmetadata', onMeta);
        audio.addEventListener('durationchange', onMeta);
        audio.addEventListener('waiting', onWait);
        audio.addEventListener('canplay', onCanPlay);

        return () => {
            stopRAF();
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('loadedmetadata', onMeta);
            audio.removeEventListener('durationchange', onMeta);
            audio.removeEventListener('waiting', onWait);
            audio.removeEventListener('canplay', onCanPlay);
        };
    }, [startRAF, stopRAF, applyProgress]);

    return (
        <div
            className="mt-3 flex items-center gap-2 rounded-xl px-2 py-2"
            style={{
                minWidth: 200,
                background: theme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(4px)',
            }}
        >
            <audio ref={audioRef} src={src} preload="metadata" />

            <button
                onClick={togglePlay}
                className="flex-shrink-0 flex items-center justify-center rounded-full w-8 h-8 transition-transform active:scale-90"
                style={{
                    background: accentColor,
                    boxShadow: `0 2px 8px ${accentColor}55`,
                }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isLoading
                    ? <Loader2 size={14} className="animate-spin" color="#fff" />
                    : isPlaying
                        ? <Pause size={14} fill="#fff" color="#fff" />
                        : <Play size={14} fill="#fff" color="#fff" style={{ marginLeft: 1 }} />
                }
            </button>

            {}
            <div
                className="flex-1 flex flex-col gap-1 cursor-pointer select-none"
                onClick={handleSeek}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={duration || 1}
                aria-valuenow={0}
            >
                {}
                <div ref={waveformRef} className="flex items-end gap-[2px] h-[20px] overflow-hidden">
                    {BAR_HEIGHTS.map((h, i) => (
                        <div
                            key={i}
                            className="flex-1 rounded-full"
                            style={{
                                height: h,
                                minWidth: 2,
                                background: (i + 1) / BAR_HEIGHTS.length <= initProgress ? accentColor : dimColor,
                            }}
                        />
                    ))}
                </div>

                {}
                <div
                    className="relative w-full rounded-full overflow-hidden"
                    style={{ height: 2, background: dimColor }}
                >
                    <div
                        ref={progressBarRef}
                        className="absolute left-0 top-0 h-full w-full rounded-full origin-left"
                        style={{
                            background: accentColor,
                            transform: `scaleX(${initProgress})`,
                        }}
                    />
                </div>
            </div>

            <div
                className="flex-shrink-0 text-[10px] font-mono font-semibold tabular-nums -ml-1"
                style={{ color: theme.isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', minWidth: 36, textAlign: 'right' }}
            >
                <span ref={timeDisplayRef}>{formatTime(duration)}</span>
            </div>
        </div>
    );
});

export default AudioPlayer;