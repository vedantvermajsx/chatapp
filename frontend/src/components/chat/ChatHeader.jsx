import { Users, Menu, Settings, Phone, Video } from 'lucide-react';
import { isDesktop } from 'react-device-detect';
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
  onLeaveRoom
}) {
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const { theme } = useTheme();
  const leaveRoomMutation = useLeaveRoom();
  const deleteRoomMutation = useDeleteRoom();
  const { startCall } = useCall() || {};
  const { getNeumorphicProps } = useNeumorphism();

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

  return (
    <div className="p-4 sm:p-6 border-b flex items-center" style={{
      backgroundColor: theme.background,
      borderColor: theme.isLight ? '#cbd5e0' : '#4a5568'
    }}>
      {!isDesktop && (
        <button
          onClick={onToggleSidebar}
          className="p-3 mr-3 rounded-full transition-all flex-shrink-0 z-30"
          {...getNeumorphicProps(1, 1, 1, 2)}
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" style={{ color: theme.otherUsernameColor }} />
        </button>
      )}

      <div className="flex-1 flex items-center justify-between min-w-0">
        {currentRoom ? (
          <>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <Avatar url={currentRoom.groupPic} name={currentRoom.groupName} size={10} mdSize={12} isGroup />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold truncate" style={{ color: theme.otherMessageText }}>{currentRoom.groupName}</h2>
                <p className="text-xs sm:text-sm truncate" style={{ color: theme.otherUsernameColor, opacity: 0.8 }}>{currentRoom.groupDescription}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {currentRoom.groupAdmin === user._id || user.id && (
                <button
                  onClick={() => setShowGroupSettings(true)}
                  className="p-2 sm:p-3 rounded-full transition-all"
                  {...getNeumorphicProps(1, 2, 2, 3)}
                  title="Group Settings"
                >
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.otherUsernameColor }} />
                </button>
              )}
              <button
                onClick={() => { loadRoomMembers(); setShowMembersModal(true); }}
                className="p-2 sm:p-3 rounded-full transition-all"
                {...getNeumorphicProps(1, 2, 2, 3)}
                title="Room Members"
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.otherUsernameColor }} />
              </button>

              <button
                onClick={currentRoom.groupAdmin === user._id ? handleDeleteRoom : handleLeaveRoom}
                disabled={leaveRoomMutation.isPending || deleteRoomMutation.isPending}
                className="p-2  rounded-full transition-all text-red-500 hover:text-red-600 disabled:opacity-50"
                {...getNeumorphicProps(1, 1, 1, 1)}
                title={currentRoom?.groupAdmin === user?._id ? 'Delete room' : 'Leave Room'}
              >
                <span className='w-8 h-4 text-xs'>{currentRoom?.groupAdmin === user?._id ? 'Delete room' : 'Leave Room'}</span>
              </button>


            </div>

          </>
        ) : currentPrivateChat ? (
          <>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 relative">
                <Avatar url={currentPrivateChat.avatar} name={currentPrivateChat.username} gender={currentPrivateChat.gender} size={10} mdSize={12} />
                {currentPrivateChat.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00ff00] rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold truncate" style={{ color: theme.otherMessageText }}>{currentPrivateChat.username}</h2>
                <p className="text-xs sm:text-sm" style={{ color: theme.otherUsernameColor, opacity: 0.8 }}>
                  {currentPrivateChat.isOnline ? 'Online' : formatLastSeen(currentPrivateChat.lastSeen)}
                </p>
              </div>
            </div>
            {currentPrivateChat.isOnline && (
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <button
                  onClick={() => startCall && startCall(currentPrivateChat.id, false, currentPrivateChat)}
                  className="p-2 sm:p-3 rounded-full transition-all text-green-500 hover:text-green-600"
                  {...getNeumorphicProps(1, 2, 2, 3)}
                  title="Voice Call"
                >
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() => startCall && startCall(currentPrivateChat.id, true, currentPrivateChat)}
                  className="p-2 sm:p-3 rounded-full transition-all text-blue-500 hover:text-blue-600"
                  {...getNeumorphicProps(1, 2, 2, 3)}
                  title="Video Call"
                >
                  <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-10 sm:h-12">
            <h2 className="text-sm sm:text-lg font-bold text-center" style={{ color: theme.otherUsernameColor, opacity: 0.7 }}>Select a room or start a private chat</h2>
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