import { useCallback, useEffect, useState } from 'react';
import { Loader2, ShieldBan, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../contexts/ThemeContext';
import adminService from '../../services/admin.service';

export default function BansPanel() {
  const { theme } = useTheme();
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getBans();
      setBans(res.bans || []);
    } catch {
      setBans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unban = async (userId) => {
    setBusyId(userId);
    try {
      await adminService.unbanUser(userId);
      toast.success('User unblocked');
      setBans((prev) => prev.filter((b) => b.userId !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not unblock');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.muted }} /></div>;
  }

  if (!bans.length) {
    return <p className="py-10 text-center text-sm" style={{ color: theme.muted }}>No active blocks</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {bans.map((b) => (
        <div key={b.userId} className="rounded-xl p-3 flex items-center justify-between gap-3" style={{ backgroundColor: theme.background }}>
          <div className="flex items-center gap-2 min-w-0">
            <ShieldBan className="w-4 h-4 flex-shrink-0" style={{ color: '#f59e0b' }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: theme.otherMessageText }}>{b.username || b.userId}</p>
              <p className="text-[11px]" style={{ color: theme.muted }}>
                {b.expiresAt ? `Blocked until ${new Date(b.expiresAt).toLocaleString()}` : 'Blocked'}
              </p>
            </div>
          </div>
          <button
            disabled={busyId === b.userId}
            onClick={() => unban(b.userId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium disabled:opacity-50 flex-shrink-0"
            style={{ backgroundColor: theme.otherMessageBubble, color: theme.otherMessageText }}
          >
            {busyId === b.userId
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ShieldOff className="w-3.5 h-3.5" />}
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
}
