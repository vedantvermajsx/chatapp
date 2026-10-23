import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../../contexts/ThemeContext';

const BlockedUsersList = ({ label = 'Blocked users', load, onUnblock }) => {
  const { theme } = useTheme();
  const [list, setList] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((l) => { if (!cancelled) setList(l); })
      .catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, []);

  const handleUnblock = async (userId) => {
    setBusyId(userId);
    try {
      await onUnblock(userId);
      setList((prev) => prev.filter((b) => b.userId !== userId));
      toast.success('User unblocked');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblock user');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <label className="block text-sm font-bold mb-2" style={{ color: theme.otherUsernameColor }}>{label}</label>
      {list === null ? (
        <p className="text-xs opacity-70" style={{ color: theme.otherUsernameColor }}>Loading...</p>
      ) : list.length === 0 ? (
        <p className="text-xs opacity-70" style={{ color: theme.otherUsernameColor }}>No blocked users</p>
      ) : (
        <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
          {list.map((b) => (
            <li key={b.userId} className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl" style={{ backgroundColor: theme.background }}>
              <span className="text-sm font-semibold truncate" style={{ color: theme.otherMessageText }}>{b.username}</span>
              <button
                type="button"
                disabled={busyId === b.userId}
                onClick={() => handleUnblock(b.userId)}
                className="text-xs font-bold text-red-500 disabled:opacity-50"
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlockedUsersList;
