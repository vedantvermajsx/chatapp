import { X } from 'lucide-react';

function ProgressLoader({ progress, onCancel }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rounded-lg bg-black/55">
            <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="white"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 46}
                        strokeDashoffset={(2 * Math.PI * 46) * (1 - progress / 100)}
                        className="transition-all duration-150"
                    />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
                </div>
            </div>

            {onCancel && (
                <button
                    type="button"
                    aria-label="Cancel upload"
                    title="Cancel upload"
                    onClick={(e) => { e.stopPropagation(); onCancel(); }}
                    className="pointer-events-auto absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
                >
                    <X className="w-4 h-4 text-white" />
                </button>
            )}
        </div>
    );
}

export default ProgressLoader;
