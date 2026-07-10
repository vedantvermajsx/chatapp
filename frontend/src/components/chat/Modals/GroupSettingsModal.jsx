import { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import roomService from '../../../services/room.service';
import messageService from '../../../services/message.service';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';

const GroupSettingsModal = ({ room, onClose, onUpdateSuccess }) => {
  const { theme } = useTheme();
  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  const [groupName, setGroupName] = useState(room.groupName || '');
  const [groupDescription, setGroupDescription] = useState(room.groupDescription || '');
  const [groupPic, setGroupPic] = useState(room.groupPic || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const hasChanges = useMemo(() => {
    return (
      groupName.trim() !== (room.groupName || '').trim() ||
      groupDescription.trim() !== (room.groupDescription || '').trim() ||
      groupPic.trim() !== (room.groupPic || '').trim()
    );
  }, [groupName, groupDescription, groupPic, room.groupName, room.groupDescription, room.groupPic]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be less than 8MB');
      return;
    }

    setIsUploading(true);

    try {
      const result = await messageService.uploadFile(file, 'avatar');
      setGroupPic(result.url);
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
      const updatedData = { groupName: groupName.trim(), groupDescription: groupDescription.trim(), groupPic };
      const updatedRoom = await roomService.updateRoom(room._id, updatedData);
      toast.success('Group updated successfully');
      onUpdateSuccess(updatedRoom.room);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update group');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" style={{
        backgroundColor: theme.background,
        boxShadow: isLight
          ? '1px 1px 2px rgba(0,0,0,0.1), -1px -1px 2px rgba(255,255,255,0.8)'
          : '1px 1px 2px rgba(0,0,0,0.4), -1px -1px 2px rgba(255,255,255,0.05)'
      }}>
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: isLight ? '#cbd5e0' : '#4a5568' }}>
          <h2 className="text-xl font-bold" style={{ color: theme.otherMessageText }}>Group Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full transition-all" style={{
            backgroundColor: theme.background,
            boxShadow: isLight
              ? '0px 1px 1px rgba(0,0,0,0.1), -1px -1px 1px rgba(255,255,255,0.8)'
              : '0px 1px 1px rgba(0,0,0,0.4), -1px -1px 1px rgba(255,255,255,0.05)'
          }}>
            <X className="w-5 h-5" style={{ color: theme.otherUsernameColor }} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="group-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar url={groupPic} name={groupName} size={24} className="w-24 h-24 text-3xl" style={{
                  boxShadow: isLight
                    ? 'inset 1px 1px 3px rgba(0,0,0,0.1), inset -1px -1px 3px rgba(255,255,255,0.8)'
                    : 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.05)'
                }} isGroup />
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
                  title="Upload group picture"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.otherUsernameColor }} /> : <Camera className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.otherUsernameColor }}>Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 border-none rounded-xl transition-all"
                style={{
                  backgroundColor: theme.background,
                  color: theme.otherMessageText,
                  boxShadow: isLight
                    ? 'inset 1px 1px 2px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.8)'
                    : 'inset 1px 1px 2px rgba(0,0,0,0.4), inset -1px -2px 2px rgba(255,255,255,0.05)'
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.otherUsernameColor }}>Description</label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-none rounded-xl transition-all resize-none"
                style={{
                  backgroundColor: theme.background,
                  color: theme.otherMessageText,
                  boxShadow: isLight
                    ? 'inset 1px 1px 2px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.8)'
                    : 'inset 1px 1px 2px rgba(0,0,0,0.4), inset -1px -2px 2px rgba(255,255,255,0.05)'
                }}
                placeholder="Group description..."
                required
              />
            </div>

          </form>
        </div>

        <div className="p-6 border-t" style={{ borderColor: isLight ? '#cbd5e0' : '#4a5568' }}>
          <button
            type="submit"
            form="group-form"
            disabled={isSaving || isUploading || !hasChanges}
            className="w-full py-4 font-bold rounded-2xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.background,
              color: theme.myMessageBubble,
              boxShadow: isLight
                ? 'inset 1px 1px 2px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.8)'
                : 'inset 1px 1px 2px rgba(0,0,0,0.4), inset -1px -2px 2px rgba(255,255,255,0.05)'
            }}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>, document.body
  );
};

export default GroupSettingsModal;