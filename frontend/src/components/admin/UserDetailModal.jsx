import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Avatar from '../common/Avatar';
import adminService from '../../services/admin.service';
import { formatNumber } from '../../utils/formatNumber';
import { genderLabel } from '../../utils/genderLabel';
import { timeAgo } from '../../utils/timeAgo';

export default function UserDetailModal({ userId, onClose }) {
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
                ['Messages sent', formatNumber(s.messagesSent)],
                ['Rooms joined', formatNumber(s.roomsJoined)],
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
