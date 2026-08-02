import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Avatar from '../../common/Avatar';
import Spinner from '../../common/Spinner';
import userService from '../../../services/user.service';
import { useTheme } from '../../../contexts/ThemeContext';

const genderLabel = (g) => ['Male', 'Female', 'Other'][g] || 'Unknown';

const UserProfileModal = ({ userId, fallback, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  const border = isLight ? '#cbd5e0' : '#4a5568';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      <div
        className="relative rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: theme.background,
          boxShadow: isLight
            ? '1px 1px 2px rgba(0,0,0,0.1), -1px -1px 2px rgba(255,255,255,0.8)'
            : '1px 1px 2px rgba(0,0,0,0.4), -1px -1px 2px rgba(255,255,255,0.05)'
        }}
      >
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
      </div>
    </div>
  );
};

export default UserProfileModal;
