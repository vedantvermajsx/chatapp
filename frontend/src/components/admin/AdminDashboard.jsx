import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Search, Users, UserPlus, MessageSquare, Crown,
  ChevronLeft, ChevronRight, X, Loader2, Activity, TrendingUp,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import adminService from '../../services/admin.service';
import Avatar from '../common/Avatar';

const nf = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(v >= 10_000 ? 0 : 1) + 'k';
  return String(v);
};

const genderLabel = (g) => ['Male', 'Female', 'Other'][g] ?? 'Unknown';

const shortDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function timeAgo(value) {
  if (!value) return 'never';
  const diff = Date.now() - new Date(value).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(value).toLocaleDateString();
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  const { theme } = useTheme();
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ backgroundColor: theme.otherMessageBubble }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: theme.muted }}>{label}</span>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <span className="text-2xl font-bold" style={{ color: theme.otherMessageText }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: theme.muted }}>{sub}</span>}
    </div>
  );
}

function Panel({ title, action, children }) {
  const { theme } = useTheme();
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: theme.otherMessageBubble }}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{ color: theme.otherMessageText }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function BarChart({ data, color, secondaryColor }) {
  const { theme } = useTheme();
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((a, d) => a + d.count, 0);

  if (!data.length) {
    return <div className="h-32 flex items-center justify-center text-xs" style={{ color: theme.muted }}>No data</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-[2px] h-32">
        {data.map((d) => {
          const pct = (d.count / max) * 100;
          return (
            <div
              key={d.date}
              className="flex-1 rounded-sm transition-all"
              title={`${shortDate(d.date)} • ${d.count}`}
              style={{
                height: `${Math.max(pct, d.count > 0 ? 3 : 0)}%`,
                minHeight: d.count > 0 ? 3 : 0,
                backgroundColor: d.count > 0 ? (secondaryColor || color) : 'transparent',
                opacity: d.count > 0 ? 1 : 0,
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px]" style={{ color: theme.muted }}>
        <span>{shortDate(data[0].date)}</span>
        <span>peak {max} • total {nf(total)}</span>
        <span>{shortDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

function Leaderboard({ rows, emptyLabel }) {
  const { theme } = useTheme();
  if (!rows?.length) {
    return <p className="text-xs" style={{ color: theme.muted }}>{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={r.roomId || i} className="flex items-center gap-3">
          <span className="w-4 text-xs font-bold" style={{ color: theme.muted }}>{i + 1}</span>
          <Avatar url={r.groupPic} name={r.groupName} size={7} />
          <span className="flex-1 truncate text-sm" style={{ color: theme.otherMessageText }}>{r.groupName}</span>
          <span className="text-xs font-semibold" style={{ color: theme.otherUsernameColor }}>{nf(r.count)}</span>
        </div>
      ))}
    </div>
  );
}

function GenderBars({ breakdown }) {
  const { theme } = useTheme();
  const items = [
    { label: 'Male', value: breakdown.male, color: '#3b82f6' },
    { label: 'Female', value: breakdown.female, color: '#ec4899' },
    { label: 'Other', value: breakdown.other, color: '#8b5cf6' },
  ];
  const total = Math.max(1, items.reduce((a, b) => a + b.value, 0));
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-1">
          <div className="flex justify-between text-xs" style={{ color: theme.muted }}>
            <span>{it.label}</span>
            <span>{nf(it.value)} ({Math.round((it.value / total) * 100)}%)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.background }}>
            <div className="h-full rounded-full" style={{ width: `${(it.value / total) * 100}%`, backgroundColor: it.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RetentionBars({ activity }) {
  const { theme } = useTheme();
  const items = [
    { label: 'DAU', value: activity.dau, color: '#22c55e' },
    { label: 'WAU', value: activity.wau, color: '#f59e0b' },
    { label: 'MAU', value: activity.mau, color: '#6366f1' },
  ];
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex items-end gap-4 h-32">
      {items.map((it) => (
        <div key={it.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-xs font-semibold" style={{ color: theme.otherMessageText }}>{nf(it.value)}</span>
          <div
            className="w-full rounded-t-md"
            style={{ height: `${Math.max((it.value / max) * 100, 2)}%`, backgroundColor: it.color }}
          />
          <span className="text-[10px]" style={{ color: theme.muted }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function DataTable({ kind, rows, onRowClick }) {
  const { theme } = useTheme();
  const cell = { padding: '8px 10px', fontSize: 13, color: theme.otherMessageText, whiteSpace: 'nowrap' };
  const head = { padding: '8px 10px', fontSize: 11, fontWeight: 600, color: theme.muted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.4 };

  if (!rows?.length) {
    return <p className="py-8 text-center text-sm" style={{ color: theme.muted }}>No results</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: `1px solid ${theme.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }}>
            {kind === 'rooms' ? (
              <>
                <th style={head}>Room</th>
                <th style={head}>Admin</th>
                <th style={head}>Members</th>
                <th style={head}>Created</th>
              </>
            ) : (
              <>
                <th style={head}>User</th>
                {kind === 'users' && <th style={head}>Email</th>}
                <th style={head}>Gender</th>
                {kind === 'users' && <th style={head}>Role</th>}
                <th style={head}>Status</th>
                <th style={head}>Created</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const online = !!r.isOnline;
            return (
              <tr
                key={r._id}
                onClick={() => onRowClick?.(r)}
                className={onRowClick ? 'cursor-pointer' : ''}
                style={{ borderBottom: `1px solid ${theme.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}` }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.background; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {kind === 'rooms' ? (
                  <>
                    <td style={cell}>
                      <div className="flex items-center gap-2">
                        <Avatar url={r.groupPic} name={r.groupName} size={7} />
                        <span className="font-medium">{r.groupName}</span>
                      </div>
                    </td>
                    <td style={cell}>{r.adminUsername || '—'}</td>
                    <td style={cell}>{nf(r.memberCount)}</td>
                    <td style={{ ...cell, color: theme.muted }}>{timeAgo(r.createdAt)}</td>
                  </>
                ) : (
                  <>
                    <td style={cell}>
                      <div className="flex items-center gap-2">
                        <Avatar url={r.avatar} name={r.username} gender={r.gender} size={7} />
                        <span className="font-medium">{r.username}</span>
                      </div>
                    </td>
                    {kind === 'users' && <td style={{ ...cell, color: theme.muted }}>{r.email}</td>}
                    <td style={{ ...cell, color: theme.muted }}>{genderLabel(r.gender)}</td>
                    {kind === 'users' && (
                      <td style={cell}>
                        {r.role === 'admin'
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: 'rgba(234,179,8,0.15)', color: '#eab308' }}><Crown className="w-3 h-3" />Admin</span>
                          : <span style={{ color: theme.muted }}>user</span>}
                      </td>
                    )}
                    <td style={cell}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: online ? '#22c55e' : '#9ca3af' }} />
                        <span style={{ color: theme.muted }}>{online ? 'Online' : timeAgo(r.lastSeen)}</span>
                      </span>
                    </td>
                    <td style={{ ...cell, color: theme.muted }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UserDetailModal({ userId, onClose }) {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    adminService.getUserDetail(userId)
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setData(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId]);

  const u = data?.user;
  const s = data?.stats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: theme.otherMessageBubble }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: theme.otherMessageText }}>User details</h3>
          <button onClick={onClose} className="p-1 rounded-full" style={{ color: theme.muted }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.muted }} /></div>
        )}

        {!loading && u && (
          <>
            <div className="flex items-center gap-3">
              <Avatar url={u.avatar} name={u.username} gender={u.gender} size={12} isOnline={u.isOnline} />
              <div className="min-w-0">
                <p className="font-semibold truncate" style={{ color: theme.otherMessageText }}>{u.username}</p>
                <p className="text-xs truncate" style={{ color: theme.muted }}>
                  {s.type === 'guest' ? 'Guest session' : u.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ['Messages sent', nf(s.messagesSent)],
                ['Rooms joined', nf(s.roomsJoined)],
                ['Account age', `${s.accountAgeDays}d`],
                ['Last seen', timeAgo(u.lastSeen)],
                ['Status', u.isOnline ? 'Online' : 'Offline'],
                ['Joined', new Date(u.createdAt).toLocaleDateString()],
                ['Gender', genderLabel(u.gender)],
                ['Role', s.type === 'guest' ? 'guest' : (u.role || 'user')],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl p-3" style={{ backgroundColor: theme.background }}>
                  <p className="text-[11px]" style={{ color: theme.muted }}>{label}</p>
                  <p className="text-sm font-semibold truncate" style={{ color: theme.otherMessageText }}>{value}</p>
                </div>
              ))}
            </div>

            {u.bio && (
              <div className="rounded-xl p-3" style={{ backgroundColor: theme.background }}>
                <p className="text-[11px] mb-1" style={{ color: theme.muted }}>Bio</p>
                <p className="text-sm" style={{ color: theme.otherMessageText }}>{u.bio}</p>
              </div>
            )}
          </>
        )}

        {!loading && !u && (
          <p className="py-6 text-center text-sm" style={{ color: theme.muted }}>Could not load this user.</p>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'users', label: 'Users', Icon: Users },
  { id: 'guests', label: 'Guests', Icon: UserPlus },
  { id: 'rooms', label: 'Rooms', Icon: MessageSquare },
];

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
              <StatCard icon={Users} label="Registered users" value={nf(overview.totals.users)} sub={`${nf(overview.online.users)} online now`} accent={accent} />
              <StatCard icon={Activity} label="Online now" value={nf(overview.online.total)} sub={`${nf(overview.online.guests)} guests`} accent="#22c55e" />
              <StatCard icon={UserPlus} label="Active guests" value={nf(overview.totals.guests)} sub={`${nf(overview.registrations.guestsMonth)} new (30d)`} accent={accent2} />
              <StatCard icon={MessageSquare} label="Rooms" value={nf(overview.totals.rooms)} sub="active groups" accent={accent} />
              <StatCard icon={MessageSquare} label="Total messages" value={nf(overview.totals.messages)} sub="all time" accent={accent2} />
              <StatCard icon={TrendingUp} label="New signups" value={nf(overview.registrations.today)} sub="today" accent="#f59e0b" />
              <StatCard icon={Users} label="New users" value={nf(overview.registrations.month)} sub="last 30 days" accent={accent} />
              <StatCard icon={Activity} label="Daily active" value={nf(overview.activity.dau)} sub="users in 24h" accent="#6366f1" />
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
                  {TABS.map(({ id, label, Icon }) => (
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
              </div>

              {table.loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.muted }} /></div>
              ) : (
                <DataTable kind={tab} rows={table.rows} onRowClick={tab === 'rooms' ? undefined : (r) => setDetailId(r._id)} />
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: theme.muted }}>
                  {nf(table.total)} total • page {page + 1} of {maxPage + 1}
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
            </div>
          </>
        )}
      </div>

      {detailId && <UserDetailModal userId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

export default AdminDashboard;
