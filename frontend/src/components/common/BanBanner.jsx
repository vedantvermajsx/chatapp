import { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function BanBanner() {
  const { ban } = useAuth();
  const [hidden, setHidden] = useState(false);

  const expiresAt = ban?.expiresAt ? new Date(ban.expiresAt).getTime() : null;

  useEffect(() => {
    if (!expiresAt) return undefined;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      setHidden(true);
      return undefined;
    }
    const timer = setTimeout(() => setHidden(true), remaining);
    return () => clearTimeout(timer);
  }, [expiresAt]);

  if (!ban || !expiresAt || expiresAt <= Date.now() || hidden) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center px-3 pt-2 pointer-events-none">
      <div
        className="pointer-events-auto max-w-xl w-full rounded-xl px-4 py-2.5 text-[13px] font-medium flex items-start gap-2 shadow-lg"
        style={{ backgroundColor: '#7f1d1d', color: '#fee2e2' }}
      >
        <ShieldAlert className="w-4 h-4 shrink-0 mt-px" />
        <span className="flex-1">
          You are blocked by an admin{ban.reason ? ` (${ban.reason})` : ''}. Messaging and calls are disabled until {new Date(expiresAt).toLocaleString()}.
        </span>
        <button onClick={() => setHidden(true)} aria-label="Dismiss" className="shrink-0 opacity-80 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
