import { useState } from 'react';
import { Flag, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../../contexts/ThemeContext';
import reportService from '../../../services/report.service';

const REASONS = [
  { id: 'profanity', label: 'Profanity' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'spam', label: 'Spam' },
  { id: 'hate', label: 'Hate speech' },
  { id: 'sexual', label: 'Sexual content' },
  { id: 'violence', label: 'Violence' },
  { id: 'other', label: 'Other' },
];

export default function ReportMessageModal({ message, roomId = null, onClose }) {
  const { theme } = useTheme();
  const [reason, setReason] = useState('profanity');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportedUserId = message?.senderId || message?.userId || null;
  const preview = message?.text || (message?.media?.type ? `[${message.media.type}]` : '');

  const submit = async () => {
    if (!reportedUserId) {
      toast.error('Could not identify the sender');
      return;
    }
    setSubmitting(true);
    try {
      await reportService.reportMessage({
        messageId: message?._id || message?.id || null,
        reportedUserId,
        roomId: roomId || message?.roomId || null,
        content: message?.text || '',
        media: message?.media ? { url: message.media.url, type: message.media.type } : null,
        reason,
        note: note.trim(),
      });
      toast.success('Report submitted to moderators');
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: theme.otherMessageBubble }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4" style={{ color: '#ef4444' }} />
            <h3 className="text-base font-semibold" style={{ color: theme.otherMessageText }}>Report message</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full" style={{ color: theme.muted }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {preview && (
          <div className="rounded-xl p-3" style={{ backgroundColor: theme.background }}>
            <p className="text-[11px] mb-1" style={{ color: theme.muted }}>Reported content</p>
            <p className="text-sm break-words line-clamp-3" style={{ color: theme.otherMessageText }}>{preview}</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <p className="text-[11px]" style={{ color: theme.muted }}>Reason</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: theme.background, color: theme.otherMessageText }}
          >
            {REASONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add details (optional)"
          rows={3}
          maxLength={500}
          className="rounded-xl px-3 py-2 text-sm outline-none resize-none"
          style={{ backgroundColor: theme.background, color: theme.otherMessageText }}
        />

        <p className="text-[11px]" style={{ color: theme.muted }}>
          The message content is shared with moderators in plain text for review.
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: theme.background, color: theme.otherMessageText }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: '#ef4444', color: '#fff' }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit report
          </button>
        </div>
      </div>
    </div>
  );
}
