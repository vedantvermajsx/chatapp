import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw, Users, UserPlus, MessageSquare, Activity, TrendingUp, Loader2,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import adminService from '../../../services/admin.service';
import StatCard from '../StatCard';
import Panel from '../Panel';
import LineChart from '../LineChart';
import Leaderboard from '../Leaderboard';
import GenderBars from '../GenderBars';
import RetentionBars from '../RetentionBars';
import { formatNumber } from '../../../utils/formatNumber';
import { timeAgo } from '../../../utils/timeAgo';

export default function OverviewPage() {
  const { theme } = useTheme();
  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [refreshing, setRefreshing] = useState(false);

  const accent = theme.myMessageBubble;
  const accent2 = theme.otherUsernameColor;

  const load = useCallback(async (isRefresh) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await adminService.getOverview();
      setOverview(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  if (status === 'loading') {
    return <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.muted }} /></div>;
  }

  if (status === 'error' || !overview) {
    return (
      <div className="py-24 flex flex-col items-center gap-3">
        <p className="text-sm" style={{ color: theme.muted }}>Failed to load analytics.</p>
        <button onClick={() => load(false)} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: accent, color: theme.onPrimary }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs" style={{ color: theme.muted }}>
          Updated {timeAgo(overview.generatedAt)}
        </p>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium"
          style={{ backgroundColor: theme.otherMessageBubble, color: theme.otherMessageText }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

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
        <Panel title="New registrations (30 days)"><LineChart data={overview.series.registrations} color={accent} /></Panel>
        <Panel title="Messages sent (30 days)"><LineChart data={overview.series.messages} color={accent2} /></Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Panel title="Guest sessions (30 days)"><LineChart data={overview.series.guests} color={accent2} /></Panel>
        <Panel title="Retention"><RetentionBars activity={overview.activity} /></Panel>
        <Panel title="Gender split"><GenderBars breakdown={overview.genderBreakdown} /></Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Panel title="Top rooms by members"><Leaderboard rows={overview.topRoomsByMembers} emptyLabel="No rooms yet" /></Panel>
        <Panel title="Top rooms by messages"><Leaderboard rows={overview.topRoomsByMessages} emptyLabel="No room messages yet" /></Panel>
      </div>
    </div>
  );
}
