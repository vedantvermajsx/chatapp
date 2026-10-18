import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import GuestForm from './GuestForm';
import RegisterForm from './RegisterForm';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import AuroraBackground from '../react-bits/AuroraBackground';

const COPY = {
  0: { heading: 'Welcome back', sub: 'Sign in to pick up your conversations.' },
  1: { heading: 'Join as a guest', sub: 'Jump in instantly — no account needed.' },
  2: { heading: 'Create an account', sub: 'Set up your GatherUp account in seconds.' },
};

const TABS = [
  { value: 0, label: 'Sign in' },
  { value: 2, label: 'Register' },
];

function Login() {
  const [currForm, setCurrForm] = useState(0);
  const { heading, sub } = COPY[currForm];
  
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-4 py-10 overflow-y-auto bg-base-100 auth-shell">
      <AuroraBackground />

      <div className="relative w-full max-w-[420px]" style={{ animation: 'panelIn 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center w-fit mx-auto group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
            <img src="/icon.png" alt="GatherUp" className="w-9 h-9 object-contain" />
          </div>
          <span className="text-foreground font-bold text-[15px] font-display tracking-tight">
            GatherUp
          </span>
        </Link>

        <Card className="overflow-hidden auth-card">
          <CardContent className="px-7 pt-7 pb-8">
            {currForm === 1 ? (
              <button
                onClick={() => setCurrForm(0)}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6 font-sans"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            ) : (
              <div className="relative grid grid-cols-2 rounded-xl bg-secondary/80 p-1 mb-7 gap-0.5 auth-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setCurrForm(tab.value)}
                    className={cn(
                      'auth-tab relative z-10 py-2 text-[13px] font-semibold font-sans rounded-[10px] transition-colors duration-200',
                      currForm === tab.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
                    )}
                  >
                    {currForm === tab.value && (
                      <motion.span
                        layoutId="auth-tab-pill"
                        className="auth-tab-pill absolute inset-0 rounded-[10px] bg-card shadow-[0_1px_4px_rgba(0,0,0,0.10)] -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currForm}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="text-[1.4rem] font-bold text-foreground tracking-tight mb-1 font-display">
                  {heading}
                </h1>
                <p className="text-[13px] text-muted-foreground mb-6 font-sans">{sub}</p>

                {currForm === 0 && <LoginForm setCurrForm={setCurrForm} />}
                {currForm === 1 && <GuestForm setCurrForm={setCurrForm} />}
                {currForm === 2 && <RegisterForm setCurrForm={setCurrForm} />}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-[11.5px] text-muted-foreground/70 mt-5 font-sans">
          © {new Date().getFullYear()} GatherUp · All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
