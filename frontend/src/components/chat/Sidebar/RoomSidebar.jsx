import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
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

const TABS = ['Chats', 'Explore'];

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
  unreadCounts = {},
  socket = null
}) {
  const { updateUser } = useAuth();
  const { theme } = useTheme();
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [activeTab, setActiveTab] = useState('Chats');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const deletePrivateChatMutation = useDeletePrivateChat();
  const { getNeumorphicProps } = useNeumorphism();

  const border = theme.isLight ? '#cbd5e0' : '#4a5568';
  const accent = theme.primary || '#6366f1';

  const handleDeletePrivateChat = async (otherUserId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this private chat?')) {
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
      } catch {
        toast.error('Failed to delete chat');
      }
    }
  };

  const createRoom = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const data = await roomService.createRoom(newRoomName, newRoomDesc);
      const newRoom = data.room;
      setNewRoomName('');
      setNewRoomDesc('');
      setShowCreateRoom(false);
      setShowCreateForm(false);
      if (newRoom && setJoinedRooms) {
        setJoinedRooms(prev => {
          const exists = prev.some(r => r._id === newRoom._id);
          return exists ? prev : [newRoom, ...prev];
        });
      }
      if (newRoom && onRoomCreated) {
        onRoomCreated(newRoom);
      } else if (newRoom && setCurrentRoom) {
        setCurrentPrivateChat && setCurrentPrivateChat(null);
        setCurrentRoom(newRoom);
      }
      setActiveTab('Chats');
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

  const myChatsUnread = Object.entries(unreadCounts).reduce((sum, [, v]) => sum + v, 0);

  const renderTabBar = () => (
    <div
      className="flex flex-shrink-0"
      style={{ borderBottom: `1px solid ${border}` }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        const badge = tab === "Chats" && myChatsUnread > 0 ? myChatsUnread : 0;

        return (
          <button
            key={tab}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveTab(tab)}
            className="relative flex-1 py-2.5 text-xs font-semibold transition-colors"
            style={{
              color: isActive ? accent : theme.otherMessageText,
              opacity: isActive ? 1 : 0.8,
              borderBottom: isActive
                ? `2px solid ${accent}`
                : "transparent",
              backgroundColor: "transparent",
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              {tab}

              {badge > 0 && (
                <span className="min-w-[1rem] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );

  const filteredJoinedRooms = searchQuery
    ? joinedRooms.filter(r => r.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : joinedRooms;

  const filteredPrivateChats = searchQuery
    ? privateChats.filter(c => c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    : privateChats;

  const renderMyChats = () => (
    <div className="space-y-4">
      <RoomList
        rooms={filteredJoinedRooms}
        currentRoom={currentRoom}
        handleJoinRoom={handleJoinRoom}
        loadingRooms={loadingJoinedRooms}
        unreadCounts={unreadCounts}
        label="Groups"
        emptyText="Join a group from Explore"
      />
      <PrivateChatList
        privateChats={filteredPrivateChats}
        currentPrivateChat={currentPrivateChat}
        handleStartPrivateChat={handleStartPrivateChat}
        loadingPrivateChats={loadingPrivateChats}
        handleDeletePrivateChat={handleDeletePrivateChat}
        unreadCounts={unreadCounts}
      />
    </div>
  );

  const renderSidebarContent = (showMobileClose) => (
    <div className="flex flex-col h-full overflow-hidden py-2" style={{ backgroundColor: theme.background }}>
      <SidebarHeader showMobileClose={showMobileClose} onCloseSidebar={onCloseSidebar} />

      <SidebarSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {renderTabBar()}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 md:px-4 py-3">
        <div style={{ display: activeTab === 'Chats' ? 'block' : 'none' }}>
          {renderMyChats()}
        </div>
        <div style={{ display: activeTab === 'Explore' ? 'block' : 'none' }}>
          <GlobalRoomList
            currentRoom={currentRoom}
            handleJoinRoom={handleJoinRoom}
            searchQuery={searchQuery}
            socket={socket}
            isActive={activeTab === 'Explore'}
          />
        </div>
      </div>

      { }
      {activeTab === 'Chats' && user.role !== 'guest' && (
        <div className="px-3  py-3 flex-shrink-0" style={{ borderTop: `1px solid ${border}` }}>
          <button
            onClick={() => setShowCreateForm(f => !f)}
            className="w-full py-3 rounded-2xl flex items-center gap-3 px-4"
            {...getNeumorphicProps(1, 1, 1, 1)}
            style={{ ...getNeumorphicProps(1, 1, 1, 1).style }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${accent}18` }}
            >
              <Plus className="w-3.5 h-3.5" style={{ color: accent }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: theme.otherMessageText }}>
              New Room
            </span>
            {showCreateForm
              ? <ChevronUp className="w-3.5 h-3.5 ml-auto" style={{ color: theme.otherUsernameColor }} />
              : <ChevronDown className="w-3.5 h-3.5 ml-auto" style={{ color: theme.otherUsernameColor }} />
            }
          </button>
          {showCreateForm && (
            <div className="mt-3">
              <CreateRoomForm
                newRoomName={newRoomName}
                setNewRoomName={setNewRoomName}
                newRoomDesc={newRoomDesc}
                setNewRoomDesc={setNewRoomDesc}
                createRoom={createRoom}
              />
            </div>
          )}
        </div>
      )}

      <SidebarFooter
        user={user}
        onShowSettings={() => setShowUserSettings(true)}
        onToggleThemePicker={() => setShowThemePicker(p => !p)}
        onLogout={logout}
      />

      <ThemePicker show={showThemePicker} onClose={() => setShowThemePicker(false)} />

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
            <div className="absolute left-0 top-0 h-full w-72" style={{ backgroundColor: theme.background }}>
              {renderSidebarContent(true)}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className="w-72 flex-shrink-0 border-r hidden md:block"
      style={{ backgroundColor: theme.background, borderColor: border }}
    >
      {renderSidebarContent(false)}
    </div>
  );
}

export default RoomSidebar;
