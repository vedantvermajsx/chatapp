import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import roomService from '../../../services/room.service';
import { isMobile } from 'react-device-detect';
import RoomList from './RoomList';
import PrivateChatList from './PrivateChatList';
import CreateRoomForm from '../Modals/CreateRoomForm';
import UserSettingsModal from '../Modals/UserSettingsModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDeletePrivateChat } from '../../../hooks/useChat';
import { dbService } from '../../../services/indexedDB.service';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

import SidebarHeader from './SidebarHeader';
import SidebarSearch from './SidebarSearch';
import SidebarFooter from './SidebarFooter';
import ThemePicker from './ThemePicker';

function RoomSidebar({
  user,
  logout,
  searchQuery,
  setSearchQuery,
  rooms,
  currentRoom,
  currentPrivateChat,
  setCurrentPrivateChat,
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
  onCloseSidebar,
  setPrivateChats
}) {
  const { updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const deletePrivateChatMutation = useDeletePrivateChat();

  const handleDeletePrivateChat = async (otherUserId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this private chat?')) {
      try {
        await deletePrivateChatMutation.mutateAsync(otherUserId);
        toast.success('Chat deleted');

        if (setPrivateChats) {
          setPrivateChats(prev => prev.filter(c => c.otherUser.id !== otherUserId));
        }

        await dbService.deletePrivateChat(otherUserId);
        await dbService.deleteMessages(`private_${otherUserId}`);

        if (currentPrivateChat?.id === otherUserId) {
          setCurrentPrivateChat(null);
        }
      } catch (err) {
        toast.error('Failed to delete chat');
      }
    }
  };

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

  const { getNeumorphicProps } = useNeumorphism();

  const renderSidebarContent = (showMobileClose) => (
    <div className="flex flex-col h-full relative overflow-y-hidden" style={{ backgroundColor: theme.background }}>
      <SidebarHeader showMobileClose={showMobileClose} onCloseSidebar={onCloseSidebar} />

      <SidebarSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

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
          handleDeletePrivateChat={handleDeletePrivateChat}
        />
      </div>

      <div className="p-4 md:p-6 border-t" style={{ borderColor: theme.isLight ? '#cbd5e0' : '#4a5568' }}>
        {user.role !== 'guest' && (
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="w-full py-3 md:py-4 font-bold text-sm md:text-base rounded-2xl transition-all flex items-center justify-center gap-2"
            {...getNeumorphicProps(2, 4, 3, 6)}
            style={{ ...getNeumorphicProps(2, 4, 3, 6).style, color: theme.otherMessageText }}
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

      <SidebarFooter
        user={user}
        onShowSettings={() => setShowUserSettings(true)}
        onToggleThemePicker={() => setShowThemePicker(!showThemePicker)}
        onLogout={logout}
      />

      <ThemePicker
        show={showThemePicker}
        onClose={() => setShowThemePicker(false)}
      />

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
