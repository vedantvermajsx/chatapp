import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import adminService from '../../services/admin.service';
import DataTable from './DataTable';
import UserDetailModal from './UserDetailModal';
import BlockUserModal from './BlockUserModal';
import { formatNumber } from '../../utils/formatNumber';

const LIMIT = 25;

const FETCHERS = {
  users: (params) => adminService.getUsers(params),
  guests: (params) => adminService.getGuests(params),
  rooms: (params) => adminService.getRooms(params),
};

export default function EntityTable({ kind, placeholder }) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(0);
  const [table, setTable] = useState({ rows: [], total: 0, hasMore: false, loading: true });
  const [detailId, setDetailId] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(0); }, [debounced]);

  useEffect(() => {
    let alive = true;
    setTable((prev) => ({ ...prev, loading: true }));
    FETCHERS[kind]({ search: debounced, page, limit: LIMIT })
      .then((res) => {
        if (!alive) return;
        const rows = res.rooms || res.guests || res.users || [];
        setTable({ rows, total: res.total || 0, hasMore: !!res.hasMore, loading: false });
      })
      .catch(() => { if (alive) setTable({ rows: [], total: 0, hasMore: false, loading: false }); });
    return () => { alive = false; };
  }, [kind, debounced, page]);

  const maxPage = useMemo(() => Math.max(0, Math.ceil((table.total || 0) / LIMIT) - 1), [table.total]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: theme.otherMessageBubble }}>
        <Search className="w-4 h-4" style={{ color: theme.muted }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent outline-none text-sm flex-1"
          style={{ color: theme.otherMessageText }}
        />
        {search && <button onClick={() => setSearch('')} style={{ color: theme.muted }}><X className="w-4 h-4" /></button>}
      </div>

      <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: theme.otherMessageBubble }}>
        {table.loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.muted }} /></div>
        ) : (
          <DataTable
            kind={kind}
            rows={table.rows}
            onRowClick={kind === 'rooms' ? undefined : (r) => setDetailId(r._id)}
            onBlockClick={kind === 'rooms' ? undefined : (r) => setBlockTarget({ userId: r._id, username: r.username })}
          />
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
      </div>

      {detailId && (
        <UserDetailModal
          userId={detailId}
          onClose={() => setDetailId(null)}
          onBlock={({ userId, username }) => { setDetailId(null); setBlockTarget({ userId, username }); }}
        />
      )}

      {blockTarget && (
        <BlockUserModal
          userId={blockTarget.userId}
          username={blockTarget.username}
          onClose={() => setBlockTarget(null)}
        />
      )}
    </div>
  );
}
