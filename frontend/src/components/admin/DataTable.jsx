import { Crown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Avatar from '../common/Avatar';
import { formatNumber } from '../../utils/formatNumber';
import { genderLabel } from '../../utils/genderLabel';
import { timeAgo } from '../../utils/timeAgo';

export default function DataTable({ kind, rows, onRowClick }) {
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
                    <td style={cell}>{formatNumber(r.memberCount)}</td>
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
