function ProgressLoader({ progress }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">

                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="6"
                    />

                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="white"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 46}
                        strokeDashoffset={
                            (2 * Math.PI * 46) * (1 - progress / 100)
                        }
                        className="transition-all duration-150"
                    />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                        {progress}%
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ProgressLoader;