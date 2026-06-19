import { Search, Plus, LogOut, MessageCircle, X, Settings, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import roomService from '../../../services/room.service';
import { isMobile } from 'react-device-detect';
import RoomList from './RoomList';
import PrivateChatList from './PrivateChatList';
import CreateRoomForm from '../Modals/CreateRoomForm';
import UserSettingsModal from '../Modals/UserSettingsModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme, THEMES } from '../../../contexts/ThemeContext';

function RoomSidebar({
  user,
  logout,
  searchQuery,
  setSearchQuery,
  rooms,
  currentRoom,
  currentPrivateChat,
  joinRoom,
  startPrivateChat,
  newRoomName,
  setNewRoomName,
  newRoomDesc,
  setNewRoomDesc,
  showCreateRoom,
  setShowCreateRoom,
  loadRooms,
  privateChats,
  loadingRooms,
  loadingPrivateChats,
  showSidebar,
  onCloseSidebar
}) {
  const { updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const createRoom = useCallback(async (e) => {
    e.preventDefault();
    try {
      await roomService.createRoom(newRoomName, newRoomDesc);
      toast.success('Room created successfully!');
      setNewRoomName('');
      setNewRoomDesc('');
      setShowCreateRoom(false);
      loadRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create room');
    }
  }, [newRoomName, newRoomDesc, loadRooms, setNewRoomName, setNewRoomDesc, setShowCreateRoom]);

  const renderSidebarContent = (showMobileClose) => (
    <div className="flex flex-col h-full relative overflow-y-hidden" style={{ backgroundColor: theme.background }}>
      <div className="p-4 md:p-6 border-b flex items-center justify-between md:hidden" style={{ borderColor: theme.isLight ? '#cbd5e0' : '#4a5568' }}>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center" style={{
            backgroundColor: theme.background,
            boxShadow: theme.isLight ? '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)' : '2px 2px 4px rgba(0,0,0,0.4), -2px -2px 4px rgba(255,255,255,0.05)'
          }}>
            <MessageCircle className="w-4 h-4 md:w-6 md:h-6" style={{ color: theme.otherUsernameColor }} />
          </div>
          <h2 className="text-lg md:text-xl font-bold" style={{ color: theme.otherMessageText }}>hushline</h2>
        </div>
        {showMobileClose && (
          <button
            onClick={onCloseSidebar}
            className="p-2 md:p-3 rounded-full transition-all"
            style={{
              backgroundColor: theme.background,
              boxShadow: theme.isLight ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)' : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
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
          >
            <X className="w-4 h-4 md:w-6 md:h-6" style={{ color: theme.otherUsernameColor }} />
          </button>
        )}
      </div>

      <div className="p-3 md:p-5 border-b" style={{ borderColor: theme.isLight ? '#cbd5e0' : '#4a5568' }}>
        <div className="relative">
          <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5" style={{ color: theme.otherUsernameColor, opacity: 0.7 }} />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 md:pl-16 pr-4 md:pr-6 py-3 md:py-4 border-none focus:border-transparent focus:ring-0 rounded-2xl focus:outline-none text-sm md:text-base transition-all"
            style={{
              backgroundColor: theme.background,
              color: theme.otherMessageText,
              boxShadow: theme.isLight
                ? 'inset 1px 1px 3px rgba(0,0,0,0.1), inset -1px -1px 3px rgba(255,255,255,0.8)'
                : 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.05)'
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = theme.isLight
                ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)'
                : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = theme.isLight
                ? 'inset 1px 1px 3px rgba(0,0,0,0.1), inset -1px -1px 3px rgba(255,255,255,0.8)'
                : 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.05)';
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 md:space-y-4">
        <RoomList
          rooms={rooms}
          currentRoom={currentRoom}
          handleJoinRoom={handleJoinRoom}
          loadingRooms={loadingRooms}
        />

        <PrivateChatList
          privateChats={privateChats}
          currentPrivateChat={currentPrivateChat}
          handleStartPrivateChat={handleStartPrivateChat}
          loadingPrivateChats={loadingPrivateChats}
        />
      </div>

      <div className="p-4 md:p-6 border-t" style={{ borderColor: theme.isLight ? '#cbd5e0' : '#4a5568' }}>
        {user.role !== 'guest' && (
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="w-full py-3 md:py-4 font-bold text-sm md:text-base rounded-2xl transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: theme.background,
              color: theme.otherMessageText,
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
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" style={{ color: theme.otherUsernameColor }} />
            Create Room
          </button>
        )}

        {showCreateRoom && (
          <CreateRoomForm
            newRoomName={newRoomName}
            setNewRoomName={setNewRoomName}
            newRoomDesc={newRoomDesc}
            setNewRoomDesc={setNewRoomDesc}
            createRoom={createRoom}
          />
        )}
      </div>

      <div className="p-3 md:p-4 border-t mt-auto flex items-center justify-start" style={{ backgroundColor: theme.background, borderColor: theme.isLight ? '#cbd5e0' : '#4a5568' }}>
        {user.role !== 'guest' && (
          <button
            onClick={() => setShowUserSettings(true)}
            className="p-2 md:p-3 mr-3 md:mr-4 rounded-full transition-all"
            style={{
              backgroundColor: theme.background,
              boxShadow: theme.isLight
                ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
                : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = theme.isLight
                ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)'
                : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = theme.isLight
                ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
                : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)';
            }}
            title="Settings"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" style={{ color: theme.otherUsernameColor }} />
          </button>
        )}
        <button
          onClick={() => setShowThemePicker(!showThemePicker)}
          className="p-2 md:p-3 mr-3 md:mr-4 rounded-full transition-all"
          style={{
            backgroundColor: theme.background,
            boxShadow: theme.isLight
              ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
              : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = theme.isLight
              ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)'
              : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = theme.isLight
              ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
              : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)';
          }}
          title="Theme"
        >
          <Palette className="w-4 h-4 md:w-5 md:h-5" style={{ color: theme.otherUsernameColor }} />
        </button>
        <button
          onClick={logout}
          className="p-2 md:p-3 rounded-full transition-all"
          style={{
            backgroundColor: theme.background,
            boxShadow: theme.isLight
              ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
              : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = theme.isLight
              ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)'
              : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = theme.isLight
              ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
              : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)';
          }}
          title="Logout"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" style={{ color: theme.otherUsernameColor }} />
        </button>
      </div>

      {showThemePicker && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 p-4 md:p-6 rounded-2xl z-50 w-80 max-h-[70vh] overflow-y-auto" style={{
          backgroundColor: theme.background,
          boxShadow: theme.isLight
            ? '2px 2px 10px rgba(0,0,0,0.1), -2px -2px 10px rgba(255,255,255,0.8)'
            : '2px 2px 10px rgba(0,0,0,0.4), -2px -2px 10px rgba(255,255,255,0.05)'
        }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: theme.otherMessageText }}>Select Theme</h3>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t);
                  setShowThemePicker(false);
                }}
                className="p-3 rounded-xl flex flex-col items-center gap-2 transition-all"
                style={{
                  backgroundColor: theme.background,
                  boxShadow: theme.id === t.id
                    ? (theme.isLight ? 'inset 2px 2px 5px rgba(0,0,0,0.1), inset -2px -2px 5px rgba(255,255,255,0.8)' : 'inset 2px 2px 5px rgba(0,0,0,0.4), inset -2px -2px 5px rgba(255,255,255,0.05)')
                    : (theme.isLight ? '2px 2px 5px rgba(0,0,0,0.1), -2px -2px 5px rgba(255,255,255,0.8)' : '2px 2px 5px rgba(0,0,0,0.4), -2px -2px 5px rgba(255,255,255,0.05)')
                }}
                onMouseEnter={(e) => {
                  if (theme.id !== t.id) {
                    e.currentTarget.style.boxShadow = theme.isLight
                      ? 'inset 2px 2px 5px rgba(0,0,0,0.1), inset -2px -2px 5px rgba(255,255,255,0.8)'
                      : 'inset 2px 2px 5px rgba(0,0,0,0.4), inset -2px -2px 5px rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme.id !== t.id) {
                    e.currentTarget.style.boxShadow = theme.isLight
                      ? '2px 2px 5px rgba(0,0,0,0.1), -2px -2px 5px rgba(255,255,255,0.8)'
                      : '2px 2px 5px rgba(0,0,0,0.4), -2px -2px 5px rgba(255,255,255,0.05)';
                  }
                }}
              >
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.myMessageBubble }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.otherMessageBubble }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.background }} />
                </div>
                <span className="text-xs font-medium" style={{ color: theme.otherMessageText }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showUserSettings && (
        <UserSettingsModal
          user={user}
          onClose={() => setShowUserSettings(false)}
          onUpdateSuccess={updateUser}
        />
      )}
    </div>
  );

  const handleJoinRoom = (roomId) => {
    joinRoom(roomId);
    onCloseSidebar && onCloseSidebar();
  };

  const handleStartPrivateChat = (otherUser) => {
    startPrivateChat(otherUser);
    onCloseSidebar && onCloseSidebar();
  };

  if (isMobile) {
    return (
      <>
        {showSidebar && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={onCloseSidebar} />
            <div className="absolute left-0 top-0 h-full w-80" style={{ backgroundColor: theme.background }}>
              {renderSidebarContent(true)}
            </div>
          </div>
        )}
      </>
    );
  }

  return <div className="w-80 flex-shrink-0 border-r hidden md:block" style={{ backgroundColor: theme.background, borderColor: theme.isLight ? '#cbd5e0' : '#4a5568' }}>{renderSidebarContent(false)}</div>;
}

export default RoomSidebar;
