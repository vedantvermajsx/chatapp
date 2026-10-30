import { useCallback, useEffect, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Flag, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import adminService from '../../services/admin.service';
import { REPORT_TABS } from './tabs';
import ModerateReportModal from './ModerateReportModal';
import { timeAgo } from '../../utils/timeAgo';
import { formatNumber } from '../../utils/formatNumber';

const LIMIT = 25;

export default function ReportsPanel({ accent }) {
  const { theme } = useTheme();
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ reports: [], total: 0, hasMore: false });
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getReports({ status, page, limit: LIMIT });
      setData({ reports: res.reports || [], total: res.total || 0, hasMore: !!res.hasMore });
    } catch {
      setData({ reports: [], total: 0, hasMore: false });
    } finally {
      setLoading(false);
    }
  }, [status, page, reloadKey]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [status]);

  const maxPage = Math.max(0, Math.ceil((data.total || 0) / LIMIT) - 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 p-1 rounded-full self-start" style={{ backgroundColor: theme.background }}>
        {REPORT_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatus(t.id)}
            className="px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: status === t.id ? accent : 'transparent',
              color: status === t.id ? theme.onPrimary : theme.otherMessageText,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.muted }} /></div>
      ) : data.reports.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: theme.muted }}>No {status} reports</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.reports.map((r) => (
            <button
              key={r._id}
              onClick={() => setActive(r)}
              className="text-left rounded-xl p-3 flex flex-col gap-1.5"
              style={{ backgroundColor: theme.background }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold min-w-0" style={{ color: theme.otherMessageText }}>
                  <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: theme.muted }} />
                  <span className="truncate">{r.reportedUsername || r.reportedUserId}</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.otherMessageBubble, color: theme.muted }}>
                  <Flag className="w-3 h-3" />{r.reason}
                </span>
              </div>
              {r.content && (
                <p className="text-xs line-clamp-2" style={{ color: theme.muted }}>{r.content}</p>
              )}
              <span className="text-[11px]" style={{ color: theme.muted }}>
                reported by {r.reporterUsername || r.reporterId} • {timeAgo(r.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: theme.muted }}>
          {formatNumber(data.total)} total • page {page + 1} of {maxPage + 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="p-2 rounded-full disabled:opacity-40"
            style={{ backgroundColor: theme.background, color: theme.otherMessageText }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={!data.hasMore}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-full disabled:opacity-40"
            style={{ backgroundColor: theme.background, color: theme.otherMessageText }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {active && (
        <ModerateReportModal
          report={active}
          onClose={() => setActive(null)}
          onDone={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
