import { useState } from 'react';
import { X, Loader2, Clock, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../contexts/ThemeContext';
import adminService from '../../services/admin.service';
import { timeAgo } from '../../utils/timeAgo';
import BAN_PRESETS from '../../utils/banPresets';

export default function ModerateReportModal({ report, onClose, onDone }) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(null);

  const act = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
      toast.success('Action applied');
      onDone?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const restrict = (ms) =>
    act(`timed-${ms}`, () =>
      adminService.banUser(report.reportedUserId, {
        durationMs: ms,
        reason: report.reason,
        reportId: report._id,
      })
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: theme.otherMessageBubble }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: theme.otherMessageText }}>Moderate report</h3>
          <button onClick={onClose} className="p-1 rounded-full" style={{ color: theme.muted }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ backgroundColor: theme.background }}>
            <p className="text-[11px]" style={{ color: theme.muted }}>Reported user</p>
            <p className="text-sm font-semibold truncate" style={{ color: theme.otherMessageText }}>{report.reportedUsername || report.reportedUserId}</p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: theme.background }}>
            <p className="text-[11px]" style={{ color: theme.muted }}>Reported by</p>
            <p className="text-sm font-semibold truncate" style={{ color: theme.otherMessageText }}>{report.reporterUsername || report.reporterId}</p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: theme.background }}>
            <p className="text-[11px]" style={{ color: theme.muted }}>Reason</p>
            <p className="text-sm font-semibold capitalize" style={{ color: theme.otherMessageText }}>{report.reason}</p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: theme.background }}>
            <p className="text-[11px]" style={{ color: theme.muted }}>Reported</p>
            <p className="text-sm font-semibold" style={{ color: theme.otherMessageText }}>{timeAgo(report.createdAt)}</p>
          </div>
        </div>

        {report.content && (
          <div className="rounded-xl p-3" style={{ backgroundColor: theme.background }}>
            <p className="text-[11px] mb-1" style={{ color: theme.muted }}>Reported content</p>
            <p className="text-sm break-words whitespace-pre-wrap" style={{ color: theme.otherMessageText }}>{report.content}</p>
          </div>
        )}

        {report.note && (
          <div className="rounded-xl p-3" style={{ backgroundColor: theme.background }}>
            <p className="text-[11px] mb-1" style={{ color: theme.muted }}>Reporter note</p>
            <p className="text-sm break-words" style={{ color: theme.otherMessageText }}>{report.note}</p>
          </div>
        )}

        {report.status !== 'open' ? (
          <p className="text-sm text-center" style={{ color: theme.muted }}>
            This report was already {report.status}.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>Block duration (disables messaging + calls)</p>
              <div className="flex flex-wrap gap-2">
                {BAN_PRESETS.map((p) => (
                  <button
                    key={p.ms}
                    disabled={!!busy}
                    onClick={() => restrict(p.ms)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: theme.background, color: theme.otherMessageText }}
                  >
                    {busy === `timed-${p.ms}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!!busy}
              onClick={() => act('dismiss', () => adminService.dismissReport(report._id))}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: theme.background, color: theme.otherMessageText }}
            >
              {busy === 'dismiss' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Dismiss report
            </button>
          </>
        )}
      </div>
    </div>
  );
}
