import { useState } from 'react';
import { X, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../contexts/ThemeContext';
import adminService from '../../services/admin.service';
import BAN_PRESETS from '../../utils/banPresets';

export default function BlockUserModal({ userId, username, onClose, onDone }) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(null);

  const block = async (ms) => {
    setBusy(ms);
    try {
      await adminService.banUser(userId, { durationMs: ms });
      toast.success('User blocked');
      onDone?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not block user');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
        style={{ backgroundColor: theme.otherMessageBubble }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold truncate" style={{ color: theme.otherMessageText }}>
            Block {username || 'user'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full flex-shrink-0" style={{ color: theme.muted }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs" style={{ color: theme.muted }}>
          Disables messaging and calls for the selected duration.
        </p>

        <div className="flex flex-wrap gap-2">
          {BAN_PRESETS.map((p) => (
            <button
              key={p.ms}
              disabled={!!busy}
              onClick={() => block(p.ms)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: theme.background, color: theme.otherMessageText }}
            >
              {busy === p.ms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
