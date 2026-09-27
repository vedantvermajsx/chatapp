
export default function PageLoader() {
  return (
    <div className="h-dvh w-full flex items-center justify-center bg-[#0b0c0e]">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
          <img
            src="/icon.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 m-auto w-6 h-6 object-contain opacity-90"
          />
        </div>
        <p className="text-white/40 text-[12.5px] font-medium tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Loading GatherUp…
        </p>
      </div>
    </div>
  );
}
