import { useState, useRef, useEffect } from 'react';
import { X, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import userService from '../../../services/user.service';
import api from '../../../services/api';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import authService from '../../../services/auth.service';

const UserSettingsModal = ({ user, onClose, onUpdateSuccess }) => {
  const { theme } = useTheme();
  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const fileInputRef = useRef(null);
  const requestRef = useRef(0); // tracks the latest request ID to discard stale responses

  useEffect(() => {
    const trimmed = username.trim();

    // Skip check if username hasn't changed
    if (trimmed === user.username) {
      setUsernameStatus(null);
      return;
    }

    if (trimmed.length < 2) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');

    // Assign a unique ID to this check
    const requestId = ++requestRef.current;

    const timeout = setTimeout(async () => {
      try {
        const res = await authService.checkUsername(trimmed);
        // Ignore response if a newer request has been fired
        if (requestId !== requestRef.current) return;
        setUsernameStatus(res.isTaken ? 'taken' : 'available');
      } catch (err) {
        if (requestId !== requestRef.current) return;
        setUsernameStatus('error');
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [username, user.username]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'avatar');

    try {
      const response = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(response.data.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedData = { username: username.trim(), bio: bio.trim(), avatar: avatarUrl };
      const res = await userService.updateProfile(updatedData);
      toast.success('Profile updated successfully');
      onUpdateSuccess(res.user);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" style={{
        backgroundColor: theme.background,
        boxShadow: isLight
          ? '1px 1px 2px rgba(0,0,0,0.1), -1px -1px 2px rgba(255,255,255,0.8)'
          : '1px 1px 2px rgba(0,0,0,0.4), -1px -1px 2px rgba(255,255,255,0.05)'
      }}>
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: isLight ? '#cbd5e0' : '#4a5568' }}>
          <h2 className="text-xl font-bold" style={{ color: theme.otherMessageText }}>Profile Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full transition-all" style={{
            backgroundColor: theme.background,
            boxShadow: isLight
              ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
              : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = isLight
              ? 'inset 1px 1px 3px rgba(0,0,0,0.1), inset -1px -1px 3px rgba(255,255,255,0.8)'
              : 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.05)';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = isLight
              ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
              : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)';
          }}>
            <X className="w-5 h-5" style={{ color: theme.otherUsernameColor }} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar url={avatarUrl} name={username} gender={user.gender} size={24} className="w-24 h-24 text-3xl" style={{
                  boxShadow: isLight
                    ? 'inset 1px 1px 3px rgba(0,0,0,0.1), inset -1px -1px 3px rgba(255,255,255,0.8)'
                    : 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.05)'
                }} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2 rounded-full transition-all border"
                  style={{
                    backgroundColor: theme.background,
                    boxShadow: isLight
                      ? '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)'
                      : '2px 2px 4px rgba(0,0,0,0.4), -2px -2px 4px rgba(255,255,255,0.05)',
                    borderColor: isLight ? '#e2e8f0' : '#4a5568'
                  }}
                  title="Upload picture"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.otherUsernameColor }} /> : <Camera className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.otherUsernameColor }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-none rounded-xl focus:outline-none transition-all"
                style={{
                  backgroundColor: theme.background,
                  color: theme.otherMessageText,
                  boxShadow: isLight
                    ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)'
                    : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)'
                }}
                required
              />
              {usernameStatus === 'checking' && <p className="text-sm text-blue-500 mt-2 flex items-center font-semibold"><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Checking availability...</p>}
              {usernameStatus === 'available' && <p className="text-sm text-green-500 mt-2 font-semibold">✓ Username is available</p>}
              {usernameStatus === 'taken' && <p className="text-sm text-red-500 mt-2 font-semibold">✗ Username is already taken</p>}
              {usernameStatus === 'invalid' && <p className="text-sm text-red-500 mt-2 font-semibold">Username must be at least 2 characters</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.otherUsernameColor }}>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-none rounded-xl focus:outline-none transition-all resize-none"
                style={{
                  backgroundColor: theme.background,
                  color: theme.otherMessageText,
                  boxShadow: isLight
                    ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)'
                    : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)'
                }}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.otherUsernameColor }}>Or, Image URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-4 py-3 border-none rounded-xl focus:outline-none transition-all text-sm"
                style={{
                  backgroundColor: theme.background,
                  color: theme.otherMessageText,
                  boxShadow: isLight
                    ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)'
                    : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)'
                }}
                placeholder="https://..."
              />
            </div>

          </form>
        </div>

        <div className="p-6 border-t" style={{ borderColor: isLight ? '#cbd5e0' : '#4a5568' }}>
          <button
            type="submit"
            form="profile-form"
            disabled={isSaving || isUploading}
            className="w-full py-4 font-bold rounded-2xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.background,
              color: theme.myMessageBubble,
              boxShadow: isLight
                ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)'
                : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)'
            }}
            onMouseEnter={(e) => {
              if (!isSaving && !isUploading) {
                e.currentTarget.style.backgroundColor = isLight ? '#d4d4d4' : '#3f3f46';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.background;
            }}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;
