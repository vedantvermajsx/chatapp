import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Lock, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import FadeIn from '../react-bits/FadeIn';
import VideoHero from '../react-bits/VideoHero';

function LandingPage() {
  const { user } = useAuth();
  const primaryHref = user ? '/chat' : '/login';
  const primaryLabel = user ? 'Open Chat' : 'Get started';

  const scrollRef = useRef(null);
  const heroRef = useRef(null);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  const handleScroll = () => {
    const heroHeight = heroRef.current?.offsetHeight ?? 0;
    setScrolledPastHero((scrollRef.current?.scrollTop ?? 0) > heroHeight - 60);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative h-full w-full overflow-y-auto bg-base-100 text-foreground font-sans"
    >
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-30 transition-colors duration-300',
          scrolledPastHero
            ? 'bg-base-100/90 backdrop-blur-sm border-b border-border'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/icon.png" alt="GatherUp" className="w-7 h-7 object-contain rounded-md" />
            <span className={cn('font-semibold text-[15px] font-display', !scrolledPastHero && 'text-white')}>
              GatherUp
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {!user && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn('hidden sm:inline-flex', !scrolledPastHero && 'text-white hover:bg-white/10 hover:text-white')}
              >
                <Link to="/login">Sign in</Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link to={primaryHref}>{primaryLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      <VideoHero sectionRef={heroRef} className="h-dvh min-h-[480px]">
        <FadeIn>
          <h1 className="text-[2.5rem] sm:text-[3.2rem] font-bold tracking-tight leading-[1.1] text-white">
            Chat that feels fast, private, and yours
          </h1>
        </FadeIn>

        <FadeIn delay={0.05}>
          <p className="mt-5 text-[16px] text-white/80 max-w-lg mx-auto leading-relaxed">
            A real-time messenger with end-to-end encryption and live calls.
            Sign up in seconds, or jump in as a guest.
          </p>
        </FadeIn>
      </VideoHero>

      {/* Security */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-border">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <p className="text-[12.5px] font-semibold text-primary tracking-wide uppercase mb-3">Security</p>
            <h2 className="text-[1.75rem] font-bold tracking-tight font-display mb-4">
              Your conversations, encrypted end-to-end
            </h2>
            <p className="text-muted-foreground text-[14.5px] leading-relaxed mb-6">
              Every device generates its own key pair. Messages are encrypted before they ever
              leave your browser, so not even GatherUp's servers can read them.
            </p>
            <ul className="space-y-2.5">
              {['RSA key pairs generated per device', 'Offline message queue with local sync', 'No plaintext storage on the server'].map((line) => (
                <li key={line} className="flex items-center gap-2.5 text-[13.5px] text-foreground/90">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.08}>
            <div className="rounded-2xl border border-border p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-secondary text-primary flex items-center justify-center">
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <p className="font-semibold text-[13.5px] font-display">Encrypted session</p>
                  <p className="text-[12px] text-muted-foreground">AES + RSA hybrid encryption</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="h-2 rounded-full bg-secondary w-full" />
                <div className="h-2 rounded-full bg-secondary w-4/5" />
                <div className="h-2 rounded-full bg-primary/20 w-2/3" />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>


      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="GatherUp" className="w-5 h-5 object-contain rounded" />
            <span className="text-[13px] font-semibold font-display">GatherUp</span>
          </div>
          <p className="text-[12px] text-muted-foreground">© {new Date().getFullYear()} GatherUp. All rights reserved.</p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link to="/terms" className="text-[12px] hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
