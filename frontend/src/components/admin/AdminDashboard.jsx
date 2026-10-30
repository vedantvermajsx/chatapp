import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Search, Users, UserPlus, MessageSquare,
  ChevronLeft, ChevronRight, X, Loader2, Activity, TrendingUp, Crown,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import adminService from '../../services/admin.service';
import { ADMIN_TABS } from './tabs';
import StatCard from './StatCard';
import Panel from './Panel';
import BarChart from './BarChart';
import Leaderboard from './Leaderboard';
import GenderBars from './GenderBars';
import RetentionBars from './RetentionBars';
import DataTable from './DataTable';
import UserDetailModal from './UserDetailModal';
import ReportsPanel from './ReportsPanel';
import BansPanel from './BansPanel';
import { formatNumber } from '../../utils/formatNumber';
import { timeAgo } from '../../utils/timeAgo';

function AdminDashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | denied | error
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(0);
  const [table, setTable] = useState({ rows: [], total: 0, hasMore: false, loading: false });
  const [detailId, setDetailId] = useState(null);

  const accent = theme.myMessageBubble;
  const accent2 = theme.otherUsernameColor;

  const loadOverview = useCallback(async (isRefresh) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await adminService.getOverview();
      setOverview(data);
      setStatus('ready');
    } catch (err) {
      setStatus(err.response?.status === 403 ? 'denied' : 'error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOverview(false); }, [loadOverview]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(0); }, [tab, debounced]);

  useEffect(() => {
    if (status !== 'ready') return;
    if (tab === 'reports' || tab === 'bans') return;
    let alive = true;
    setTable((prev) => ({ ...prev, loading: true }));
    const fetcher =
      tab === 'rooms' ? adminService.getRooms({ search: debounced, page, limit: 25 })
      : tab === 'guests' ? adminService.getGuests({ search: debounced, page, limit: 25 })
      : adminService.getUsers({ search: debounced, page, limit: 25 });

    fetcher
      .then((res) => {
        if (!alive) return;
        const rows = res.rooms || res.guests || res.users || [];
        setTable({ rows, total: res.total, hasMore: res.hasMore, loading: false });
      })
      .catch(() => { if (alive) setTable({ rows: [], total: 0, hasMore: false, loading: false }); });

    return () => { alive = false; };
  }, [status, tab, debounced, page]);

  const maxPage = useMemo(
    () => Math.max(0, Math.ceil((table.total || 0) / 25) - 1),
    [table.total]
  );

  if (status === 'denied') {
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: theme.background }}>
        <Crown className="w-10 h-10" style={{ color: theme.muted }} />
        <h2 className="text-lg font-semibold" style={{ color: theme.otherMessageText }}>Admin access required</h2>
        <p className="text-sm max-w-sm" style={{ color: theme.muted }}>
          Your account does not have admin permissions. Ask an administrator to grant you access.
        </p>
        <button onClick={() => navigate('/chat')} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: accent, color: theme.onPrimary }}>
          Back to chat
        </button>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full overflow-y-auto custom-scrollbar" style={{ backgroundColor: theme.background }}>
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-5">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/chat')} className="p-2 rounded-full" style={{ backgroundColor: theme.otherMessageBubble, color: theme.otherMessageText }} title="Back to chat">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: theme.otherMessageText }}>Admin Analytics</h1>
              <p className="text-xs" style={{ color: theme.muted }}>
                {overview ? `Updated ${timeAgo(overview.generatedAt)}` : 'Loading platform metrics'}
              </p>
            </div>
          </div>
          <button
            onClick={() => loadOverview(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: theme.otherMessageBubble, color: theme.otherMessageText }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        {status === 'loading' && (
          <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.muted }} /></div>
        )}

        {status === 'error' && (
          <div className="py-24 flex flex-col items-center gap-3">
            <p className="text-sm" style={{ color: theme.muted }}>Failed to load analytics.</p>
            <button onClick={() => loadOverview(false)} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: accent, color: theme.onPrimary }}>Retry</button>
          </div>
        )}

        {status === 'ready' && overview && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Users} label="Registered users" value={formatNumber(overview.totals.users)} sub={`${formatNumber(overview.online.users)} online now`} accent={accent} />
              <StatCard icon={Activity} label="Online now" value={formatNumber(overview.online.total)} sub={`${formatNumber(overview.online.guests)} guests`} accent="#22c55e" />
              <StatCard icon={UserPlus} label="Active guests" value={formatNumber(overview.totals.guests)} sub={`${formatNumber(overview.registrations.guestsMonth)} new (30d)`} accent={accent2} />
              <StatCard icon={MessageSquare} label="Rooms" value={formatNumber(overview.totals.rooms)} sub="active groups" accent={accent} />
              <StatCard icon={MessageSquare} label="Total messages" value={formatNumber(overview.totals.messages)} sub="all time" accent={accent2} />
              <StatCard icon={TrendingUp} label="New signups" value={formatNumber(overview.registrations.today)} sub="today" accent="#f59e0b" />
              <StatCard icon={Users} label="New users" value={formatNumber(overview.registrations.month)} sub="last 30 days" accent={accent} />
              <StatCard icon={Activity} label="Daily active" value={formatNumber(overview.activity.dau)} sub="users in 24h" accent="#6366f1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Panel title="New registrations (30 days)"><BarChart data={overview.series.registrations} color={accent} /></Panel>
              <Panel title="Messages sent (30 days)"><BarChart data={overview.series.messages} color={accent2} secondaryColor={accent2} /></Panel>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Panel title="Guest sessions (30 days)"><BarChart data={overview.series.guests} color={accent2} /></Panel>
              <Panel title="Retention"><RetentionBars activity={overview.activity} /></Panel>
              <Panel title="Gender split"><GenderBars breakdown={overview.genderBreakdown} /></Panel>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Panel title="Top rooms by members"><Leaderboard rows={overview.topRoomsByMembers} emptyLabel="No rooms yet" /></Panel>
              <Panel title="Top rooms by messages"><Leaderboard rows={overview.topRoomsByMessages} emptyLabel="No room messages yet" /></Panel>
            </div>

            <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: theme.otherMessageBubble }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: theme.background }}>
                  {ADMIN_TABS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: tab === id ? accent : 'transparent',
                        color: tab === id ? theme.onPrimary : theme.otherMessageText,
                      }}
                    >
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  ))}
                </div>
                {tab !== 'reports' && tab !== 'bans' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full flex-1 min-w-[200px]" style={{ backgroundColor: theme.background }}>
                    <Search className="w-4 h-4" style={{ color: theme.muted }} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={tab === 'rooms' ? 'Search rooms' : 'Search by username or email'}
                      className="bg-transparent outline-none text-sm flex-1"
                      style={{ color: theme.otherMessageText }}
                    />
                    {search && <button onClick={() => setSearch('')} style={{ color: theme.muted }}><X className="w-4 h-4" /></button>}
                  </div>
                )}
              </div>

              {tab === 'reports' ? (
                <ReportsPanel accent={accent} />
              ) : tab === 'bans' ? (
                <BansPanel />
              ) : (
                <>
                  {table.loading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.muted }} /></div>
                  ) : (
                    <DataTable kind={tab} rows={table.rows} onRowClick={tab === 'rooms' ? undefined : (r) => setDetailId(r._id)} />
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: theme.muted }}>
                      {formatNumber(table.total)} total • page {page + 1} of {maxPage + 1}
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
                        disabled={!table.hasMore}
                        onClick={() => setPage((p) => p + 1)}
                        className="p-2 rounded-full disabled:opacity-40"
                        style={{ backgroundColor: theme.background, color: theme.otherMessageText }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {detailId && <UserDetailModal userId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

export default AdminDashboard;
