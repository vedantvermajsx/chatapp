import { Users, Menu, Settings } from 'lucide-react';
import { isDesktop } from 'react-device-detect';
import Avatar from '../common/Avatar';
import GroupSettingsModal from './Modals/GroupSettingsModal';
import { useState, memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { formatLastSeen } from '../../utils/dateUtils';

const ChatHeader = memo(function ChatHeader({
  user,
  currentRoom,
  currentPrivateChat,
  onToggleSidebar,
  loadRoomMembers,
  setShowMembersModal,
  setCurrentRoom
}) {
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const { theme } = useTheme();
  return (
    <div className="p-4 sm:p-6 border-b flex items-center" style={{
      backgroundColor: theme.background,
      borderColor: theme.isLight ? '#cbd5e0' : '#4a5568'
    }}>
      {!isDesktop && (
        <button
          onClick={onToggleSidebar}
          className="p-3 mr-3 rounded-full transition-all flex-shrink-0 z-30"
          style={{
            backgroundColor: theme.background,
            boxShadow: theme.isLight
              ? '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)'
              : '2px 2px 4px rgba(0,0,0,0.4), -2px -2px 4px rgba(255,255,255,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = theme.isLight
              ? 'inset 3px 3px 6px rgba(0,0,0,0.1), inset -3px -3px 6px rgba(255,255,255,0.8)'
              : 'inset 3px 3px 6px rgba(0,0,0,0.4), inset -3px -3px 6px rgba(255,255,255,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = theme.isLight
              ? '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)'
              : '2px 2px 4px rgba(0,0,0,0.4), -2px -2px 4px rgba(255,255,255,0.05)';
          }}
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
              {currentRoom.groupAdmin === user.id && (
                <button
                  onClick={() => setShowGroupSettings(true)}
                  className="p-2 sm:p-3 rounded-full transition-all"
                  style={{
                    backgroundColor: theme.background,
                    boxShadow: theme.isLight
                      ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
                      : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = theme.isLight
                      ? 'inset 3px 3px 6px rgba(0,0,0,0.1), inset -3px -3px 6px rgba(255,255,255,0.8)'
                      : 'inset 3px 3px 6px rgba(0,0,0,0.4), inset -3px -3px 6px rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = theme.isLight
                      ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
                      : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)';
                  }}
                  title="Group Settings"
                >
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.otherUsernameColor }} />
                </button>
              )}
              <button
                onClick={() => { loadRoomMembers(); setShowMembersModal(true); }}
                className="p-2 sm:p-3 rounded-full transition-all"
                style={{
                  backgroundColor: theme.background,
                  boxShadow: theme.isLight
                    ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
                    : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = theme.isLight
                    ? 'inset 3px 3px 6px rgba(0,0,0,0.1), inset -3px -3px 6px rgba(255,255,255,0.8)'
                    : 'inset 3px 3px 6px rgba(0,0,0,0.4), inset -3px -3px 6px rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = theme.isLight
                    ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
                    : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)';
                }}
                title="Room Members"
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.otherUsernameColor }} />
              </button>
            </div>
          </>
        ) : currentPrivateChat ? (
          <>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 relative">
                <Avatar url={currentPrivateChat.avatar} name={currentPrivateChat.username} gender={currentPrivateChat.gender} size={10} mdSize={12} />
                {currentPrivateChat.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold truncate" style={{ color: theme.otherMessageText }}>{currentPrivateChat.username}</h2>
                <p className="text-xs sm:text-sm" style={{ color: theme.otherUsernameColor, opacity: 0.8 }}>
                  {currentPrivateChat.isOnline ? 'Online' : formatLastSeen(currentPrivateChat.lastSeen)}
                </p>
              </div>
            </div>
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