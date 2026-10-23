import { useEffect, useState } from 'react';
import { X, Ban } from 'lucide-react';
import { toast } from 'sonner';
import Avatar from '../../common/Avatar';
import Spinner from '../../common/Spinner';
import userService from '../../../services/user.service';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';

const genderLabel = (g) => ['Male', 'Female', 'Other'][g] || 'Unknown';

const UserProfileModal = ({ userId, fallback, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  const border = isLight ? '#cbd5e0' : '#4a5568';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user: me } = useAuth();
  const isSelf = String(me?._id || me?.id) === String(userId);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);

  useEffect(() => {
    if (!userId || isSelf) return;
    let cancelled = false;
    userService.getBlockedUsers()
      .then((list) => { if (!cancelled) setIsBlocked(list.some((b) => String(b.userId) === String(userId))); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId, isSelf]);

  const toggleBlock = async () => {
    setBlockBusy(true);
    try {
      if (isBlocked) {
        await userService.unblockUser(userId);
        setIsBlocked(false);
        toast.success('User unblocked');
      } else {
        await userService.blockUser(userId);
        setIsBlocked(true);
        toast.success('User blocked');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBlockBusy(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    userService.getUserProfile(userId)
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch(() => { if (!cancelled) setError('Could not load profile'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const displayName = profile?.username || fallback?.username || '';
  const displayAvatar = profile?.pfp || fallback?.avatar || '';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="glass-strong pop-in relative rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: border }}>
          <h2 className="text-base font-bold" style={{ color: theme.otherMessageText }}>Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-full transition-all">
            <X className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center gap-3 mb-5">
            <Avatar url={displayAvatar} name={displayName} size={24} />
            <span className="text-lg font-bold" style={{ color: theme.otherMessageText }}>
              {displayName}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : error ? (
            <p className="text-sm text-center py-3 text-red-500">{error}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold opacity-60" style={{ color: theme.otherUsernameColor }}>Gender</p>
                <p className="text-sm mt-1" style={{ color: theme.otherMessageText }}>{genderLabel(profile?.gender)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold opacity-60" style={{ color: theme.otherUsernameColor }}>Bio</p>
                <p className="text-sm mt-1" style={{ color: theme.otherMessageText }}>{profile?.bio || 'No bio yet'}</p>
              </div>
            </div>
          )}
        </div>

        {!isSelf && (
          <div className="p-4 border-t" style={{ borderColor: border }}>
            <button
              onClick={toggleBlock}
              disabled={blockBusy}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ color: isBlocked ? theme.otherMessageText : '#ef4444' }}
            >
              <Ban className="w-4 h-4" />
              {isBlocked ? 'Unblock user' : 'Block user'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
