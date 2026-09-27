import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AsciiField from '../common/AsciiField';

const F_HEADING = "'Manrope', sans-serif";
const F_BODY = "'DM Sans', sans-serif";

export default function NotFound() {
  const { user } = useAuth();
  const homeHref = user ? '/chat' : '/';
  const homeLabel = user ? 'Back to chat' : 'Back to home';

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0b0c0e] text-white flex items-center justify-center px-6">
      <AsciiField
        className="absolute inset-0 text-[9px] md:text-[10px] text-white"
        cols={90}
        opacity={0.14}
      />
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_40%,rgba(255,255,255,0.06),transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <div className="flex items-center gap-2.5 mb-10">
          <img src="/icon.png" alt="GatherUp" className="w-9 h-9 object-contain" />
          <span className="font-bold text-[15px]" style={{ fontFamily: F_HEADING }}>GatherUp</span>
        </div>

        <div
          className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-6"
        >
          <Compass className="w-7 h-7 text-white/70" strokeWidth={1.75} />
        </div>

        <p
          className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-3"
          style={{ fontFamily: F_BODY }}
        >
          Error 404
        </p>
        <h1
          className="text-[2.5rem] font-bold tracking-tight leading-tight mb-3"
          style={{ fontFamily: F_HEADING }}
        >
          This page wandered off
        </h1>
        <p
          className="text-white/50 text-[14.5px] leading-relaxed mb-9"
          style={{ fontFamily: F_BODY }}
        >
          The page you're looking for doesn't exist, moved, or was never here to begin with.
        </p>

        <Link
          to={homeHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0b0c0e] text-[13.5px] font-semibold hover:bg-white/90 active:scale-[0.97] transition-all duration-150"
          style={{ fontFamily: F_BODY }}
        >
          <ArrowLeft size={14} />
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
