import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const STORAGE_KEY = 'cookie-consent';

export default function CookieConsent() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (!stored) setVisible(true);
  }, []);

  const decide = (choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* storage blocked: hide for this session only */
    }
    setVisible(false);
  };

  if (!visible || location.pathname === '/chat') return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4">
      <div className="mx-auto max-w-3xl flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-white/10 bg-[#1b1c20]/95 px-5 py-4 text-white shadow-2xl backdrop-blur">
        <p className="flex-1 text-sm text-white/80 leading-relaxed">
          We use cookies to keep you signed in and remember your preferences. See our{' '}
          <Link to="/cookie-policy" className="underline text-white hover:text-white/80">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => decide('rejected')}
            className="px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            Reject non-essential
          </button>
          <button
            onClick={() => decide('accepted')}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-white text-black hover:bg-white/90 transition"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
