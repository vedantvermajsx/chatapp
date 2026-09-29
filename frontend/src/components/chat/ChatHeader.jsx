import { Users, ArrowLeft, Settings, Phone, Video, Trash2, LogOut } from 'lucide-react';
import Avatar from '../common/Avatar';
import GroupSettingsModal from './Modals/GroupSettingsModal';
import { useState, memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { formatLastSeen } from '../../utils/dateUtils';
import { useLeaveRoom, useDeleteRoom } from '../../hooks/useChat';
import { useCall } from '../../contexts/CallContext';
import { useNeumorphism } from '../../hooks/useNeumorphism';

const ChatHeader = memo(function ChatHeader({
  user,
  currentRoom,
  currentPrivateChat,
  onToggleSidebar,
  loadRoomMembers,
  setShowMembersModal,
  setCurrentRoom,
  leaveRoomSocket,
  onLeaveRoom,
  unreadCounts = {},
}) {
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const { theme } = useTheme();
  const leaveRoomMutation = useLeaveRoom();
  const deleteRoomMutation = useDeleteRoom();
  const { startCall } = useCall() || {};
  const { getNeumorphicProps } = useNeumorphism();
  const isRoomAdmin = currentRoom && (currentRoom.groupAdmin === user?._id || currentRoom.groupAdmin === user?.id);
  const currentChatKey = currentRoom?._id
    ? `room_${currentRoom._id}`
    : currentPrivateChat?.id
      ? `private_${currentPrivateChat.id}`
      : null;
  const hiddenUnreadCount = Object.entries(unreadCounts).reduce((sum, [key, count]) => {
    if (key === currentChatKey) return sum;
    return sum + (count || 0);
  }, 0);

  const handleDeleteRoom = async () => {
    if (window.confirm(`Are you sure you want to delete ${currentRoom.groupName}?`)) {
      try {
        await deleteRoomMutation.mutateAsync(currentRoom._id);
        if (leaveRoomSocket) {
          leaveRoomSocket(currentRoom._id);
        }
        if (onLeaveRoom) onLeaveRoom(currentRoom._id);
        setCurrentRoom(null);
      } catch (err) {
        console.error('Failed to delete room:', err);
      }
    }
  };

  const handleLeaveRoom = async () => {
    if (window.confirm(`Are you sure you want to leave ${currentRoom.groupName}?`)) {
      try {
        await leaveRoomMutation.mutateAsync(currentRoom._id);
        if (leaveRoomSocket) {
          leaveRoomSocket(currentRoom._id);
        }
        if (onLeaveRoom) onLeaveRoom(currentRoom._id);
        setCurrentRoom(null);
      } catch (err) {
        console.error('Failed to leave room:', err);
      }
    }
  };

  const borderColor = theme.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.4)';
  const headerText = theme.isLight ? '#060607' : '#f2f3f5';
  const subText = theme.isLight ? '#4e5058' : '#949ba4';
  const iconColor = theme.isLight ? '#4e5058' : '#b5bac1';
  const iconHoverBg = theme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  const iconBtn = (extraClass = '') => ({
    className: `p-1.5 rounded-md transition-colors flex items-center justify-center ${extraClass}`,
    style: { color: iconColor },
    onMouseEnter: (e) => { e.currentTarget.style.backgroundColor = iconHoverBg; },
    onMouseLeave: (e) => { e.currentTarget.style.backgroundColor = 'transparent'; },
  });

  return (
    <div
      className="px-4 py-2 border-b flex items-center flex-shrink-0"
      style={{
        backgroundColor: theme.background,
        borderColor,
        minHeight: '48px',
      }}
    >
      <button
        onClick={onToggleSidebar}
        className="relative p-1.5 mr-2 rounded-md transition-colors flex-shrink-0 md:hidden flex items-center justify-center"
        style={{ color: iconColor }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = iconHoverBg; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        aria-label="Back to chats"
      >
        <ArrowLeft className="w-5 h-5" />
        {hiddenUnreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{ backgroundColor: '#f23f43', color: '#fff' }}
          >
            {hiddenUnreadCount > 99 ? '99+' : hiddenUnreadCount}
          </span>
        )}
      </button>

      <div className="flex-1 flex items-center justify-between min-w-0 gap-2">
        {currentRoom ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}
              >
                <span style={{ color: subText }} className="text-[13px] font-bold">#</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold truncate leading-tight" style={{ color: headerText }}>
                  {currentRoom.groupName}
                </h2>
                {currentRoom.groupDescription && (
                  <p className="hidden sm:block text-[14px] truncate leading-tight" style={{ color: subText }}>
                    {currentRoom.groupDescription}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => { loadRoomMembers(); setShowMembersModal(true); }}
                {...iconBtn()}
                title="Room Members"
              >
                <Users className="w-5 h-5" />
              </button>
              {isRoomAdmin && (
                <button
                  onClick={() => setShowGroupSettings(true)}
                  {...iconBtn()}
                  title="Group Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <div className="w-px h-5 mx-1" style={{ backgroundColor: borderColor }} />
              <button
                onClick={(isRoomAdmin && !currentRoom?.isDeleted) ? handleDeleteRoom : handleLeaveRoom}
                disabled={leaveRoomMutation.isPending || deleteRoomMutation.isPending}
                className="px-2 py-1 rounded-md transition-colors text-[13px] font-semibold disabled:opacity-50 flex items-center gap-1"
                style={{ color: '#f23f43' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.isLight ? 'rgba(242,63,67,0.10)' : 'rgba(242,63,67,0.16)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                title={(isRoomAdmin && !currentRoom?.isDeleted) ? 'Delete room' : 'Leave room'}
              >
                {isRoomAdmin && !currentRoom?.isDeleted ? (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Leave</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : currentPrivateChat ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex-shrink-0 relative">
                <Avatar url={currentPrivateChat.avatar} name={currentPrivateChat.username} gender={currentPrivateChat.gender} size={9} />
                {currentPrivateChat.isOnline && (
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                    style={{
                      backgroundColor: '#23a559',
                      borderColor: theme.background,
                    }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold truncate leading-tight" style={{ color: headerText }}>
                  {currentPrivateChat.username}
                </h2>
                <p className="text-[14px] leading-tight" style={{ color: subText }}>
                  {currentPrivateChat.isOnline ? 'Online' : formatLastSeen(currentPrivateChat.lastSeen)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {currentPrivateChat.isOnline && (
                <>
                  <button
                    onClick={() => startCall && startCall(currentPrivateChat.id, false, currentPrivateChat)}
                    {...iconBtn()}
                    title="Voice Call"
                  >
                    <Phone className="w-5 h-5" style={{ color: '#23a559' }} />
                  </button>
                  <button
                    onClick={() => startCall && startCall(currentPrivateChat.id, true, currentPrivateChat)}
                    {...iconBtn()}
                    title="Video Call"
                  >
                    <Video className="w-5 h-5" style={{ color: '#5865f2' }} />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center w-full">
            <h2 className="text-[14px] font-medium" style={{ color: subText }}>
              No conversation selected
            </h2>
          </div>
        )}
      </div>

      {showGroupSettings && currentRoom && (
        <GroupSettingsModal
          room={currentRoom}
          onClose={() => setShowGroupSettings(false)}
          onUpdateSuccess={(updatedRoom) => setCurrentRoom(updatedRoom)}
        />
      )}
    </div>
  );
})

export default ChatHeader;
