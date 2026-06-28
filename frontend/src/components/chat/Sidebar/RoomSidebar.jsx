import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import roomService from '../../../services/room.service';
import { isMobile } from 'react-device-detect';
import RoomList from './RoomList';
import GlobalRoomList from './GlobalRoomList';
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

const TABS = ['My Chats', 'Global'];

function RoomSidebar({
  user,
  logout,
  searchQuery,
  setSearchQuery,
  rooms,
  joinedRooms = [],
  setJoinedRooms,
  loadingJoinedRooms,
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
  loadJoinedRooms,
  onRoomCreated,
  setCurrentRoom,
  privateChats,
  loadingRooms,
  loadingPrivateChats,
  showSidebar,
  onCloseSidebar,
  setPrivateChats,
  unreadCounts = {}
}) {
  const { updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [activeTab, setActiveTab] = useState('My Chats');
  const deletePrivateChatMutation = useDeletePrivateChat();
  const { getNeumorphicProps } = useNeumorphism();

  const isLight = theme.isLight;
  const borderColor = isLight ? '#cbd5e0' : '#4a5568';

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
    if (e && e.preventDefault) e.preventDefault();
    try {
      const data = await roomService.createRoom(newRoomName, newRoomDesc);
      const newRoom = data.room;
      toast.success('Room created successfully!');
      setNewRoomName('');
      setNewRoomDesc('');
      setShowCreateRoom(false);
      // Add to joinedRooms immediately (creator is auto-member on backend)
      if (newRoom && setJoinedRooms) {
        setJoinedRooms(prev => {
          const exists = prev.some(r => r._id === newRoom._id);
          return exists ? prev : [newRoom, ...prev];
        });
      }
      // Navigate creator into the new room (emits socket joinRoom + loads messages)
      if (newRoom && onRoomCreated) {
        onRoomCreated(newRoom);
      } else if (newRoom && setCurrentRoom) {
        setCurrentPrivateChat && setCurrentPrivateChat(null);
        setCurrentRoom(newRoom);
      }
      setActiveTab('My Chats');
      loadRooms();
      if (loadJoinedRooms) loadJoinedRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create room');
    }
  }, [newRoomName, newRoomDesc, loadRooms, loadJoinedRooms, onRoomCreated, setNewRoomName, setNewRoomDesc, setShowCreateRoom, setJoinedRooms, setCurrentRoom, setCurrentPrivateChat]);

  const handleJoinRoom = useCallback((roomId, roomObject) => {
    joinRoom(roomId, roomObject);
    onCloseSidebar && onCloseSidebar();
  }, [joinRoom, onCloseSidebar]);

  const handleStartPrivateChat = useCallback((otherUser) => {
    startPrivateChat(otherUser);
    onCloseSidebar && onCloseSidebar();
  }, [startPrivateChat, onCloseSidebar]);

  // Total unread count for the "My Chats" tab badge
  const myChatsUnread = Object.entries(unreadCounts).reduce((sum, [, v]) => sum + v, 0);

  const renderTabBar = () => (
    <div className="flex mx-3 md:mx-5 mb-1 rounded-2xl overflow-hidden border" style={{ borderColor }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab;
        const badge = tab === 'My Chats' && myChatsUnread > 0 ? myChatsUnread : 0;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: isActive ? (theme.primary || '#6366f1') : 'transparent',
              color: isActive ? '#fff' : theme.otherMessageText,
              opacity: isActive ? 1 : 0.6,
            }}
          >
            {tab}
            {badge > 0 && (
              <span className="min-w-[1rem] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderMyChats = () => (
    <div className="space-y-3 md:space-y-4">
      {/* Joined Groups */}
      <RoomList
        rooms={joinedRooms}
        currentRoom={currentRoom}
        handleJoinRoom={handleJoinRoom}
        loadingRooms={loadingJoinedRooms}
        unreadCounts={unreadCounts}
        label="My Groups"
        emptyText="Join a group from the Global tab"
      />

      {/* Private Chats */}
      <PrivateChatList
        privateChats={privateChats}
        currentPrivateChat={currentPrivateChat}
        handleStartPrivateChat={handleStartPrivateChat}
        loadingPrivateChats={loadingPrivateChats}
        handleDeletePrivateChat={handleDeletePrivateChat}
        unreadCounts={unreadCounts}
      />
    </div>
  );

  const renderGlobal = () => (
    <GlobalRoomList
      currentRoom={currentRoom}
      handleJoinRoom={handleJoinRoom}
      searchQuery={searchQuery}
    />
  );

  const renderSidebarContent = (showMobileClose) => (
    <div className="flex flex-col h-full relative overflow-y-hidden" style={{ backgroundColor: theme.background }}>
      <SidebarHeader showMobileClose={showMobileClose} onCloseSidebar={onCloseSidebar} />

      <SidebarSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {renderTabBar()}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-5">
        {activeTab === 'My Chats' ? renderMyChats() : renderGlobal()}
      </div>

      {/* Create Room + Footer – shown in both tabs */}
      <div className="p-4 md:p-6 border-t" style={{ borderColor }}>
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

  return (
    <div
      className="w-80 flex-shrink-0 border-r hidden md:block"
      style={{ backgroundColor: theme.background, borderColor }}
    >
      {renderSidebarContent(false)}
    </div>
  );
}

export default RoomSidebar;