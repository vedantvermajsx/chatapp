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
  1: { heading: 'Join as a guest', sub: 'Jump in instantly, no email required.' },
  2: { heading: 'Create an account', sub: 'Set up a GatherUp account in seconds.' },
};

const TABS = [
  { value: 0, label: 'Sign in' },
  { value: 2, label: 'Create account' },
];

function Login() {
  const [currForm, setCurrForm] = useState(0);
  const { heading, sub } = COPY[currForm];

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-4 py-10 overflow-y-auto bg-base-100">
      <AuroraBackground />

      <div className="relative w-full max-w-[440px]" style={{ animation: 'panelIn 0.35s cubic-bezier(0.22,1,0.36,1) both' }}>
        <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center w-fit mx-auto">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/icon.png" alt="GatherUp" className="w-10 h-10 object-contain" />
          </div>
          <span className="text-foreground font-bold text-[16px] font-display">GatherUp</span>
        </Link>

        <Card className="shadow-sm overflow-hidden">
          <CardContent className="px-8 py-8">
            {currForm === 1 ? (
              <button
                onClick={() => setCurrForm(0)}
                className="flex items-center gap-1.5 text-[13.5px] text-muted-foreground hover:text-foreground transition-colors mb-7 font-sans"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            ) : (
              <div className="relative grid grid-cols-2 rounded-xl bg-secondary p-1 mb-7">
                {TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setCurrForm(tab.value)}
                    className={cn(
                      'relative z-10 py-1.5 text-[13.5px] font-semibold font-sans rounded-lg transition-colors',
                      currForm === tab.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
                    )}
                  >
                    {currForm === tab.value && (
                      <motion.span
                        layoutId="auth-tab-pill"
                        className="absolute inset-0 rounded-lg bg-card shadow-sm -z-10"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="text-[1.45rem] font-bold text-foreground tracking-tight mb-1.5 font-display">
                  {heading}
                </h1>
                <p className="text-[13.5px] text-muted-foreground mb-6 font-sans">{sub}</p>

                {currForm === 0 && <LoginForm setCurrForm={setCurrForm} />}
                {currForm === 1 && <GuestForm setCurrForm={setCurrForm} />}
                {currForm === 2 && <RegisterForm setCurrForm={setCurrForm} />}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-[12px] text-muted-foreground mt-6 font-sans">
          © {new Date().getFullYear()} GatherUp. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;

