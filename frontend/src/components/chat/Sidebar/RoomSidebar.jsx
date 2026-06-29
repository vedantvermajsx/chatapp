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
  unreadCounts = {}
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
      toast.success('Room created');
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
    <div className="flex px-4 md:px-5 pt-3 pb-0 gap-1 flex-shrink-0">
      {TABS.map(tab => {
        const isActive = activeTab === tab;
        const badge = tab === 'Chats' && myChatsUnread > 0 ? myChatsUnread : 0;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-semibold transition-all relative"
            style={{
              backgroundColor: isActive ? (theme.isLight ? '#fff' : theme.background) : 'transparent',
              color: isActive ? accent : theme.otherMessageText,
              opacity: isActive ? 1 : 0.5,
              borderBottom: isActive ? `2px solid ${accent}` : '2px solid transparent',
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
    <div className="space-y-4">
      <RoomList
        rooms={joinedRooms}
        currentRoom={currentRoom}
        handleJoinRoom={handleJoinRoom}
        loadingRooms={loadingJoinedRooms}
        unreadCounts={unreadCounts}
        label="Groups"
        emptyText="Join a group from Explore"
      />
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

  const renderSidebarContent = (showMobileClose) => (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: theme.background }}>
      <SidebarHeader showMobileClose={showMobileClose} onCloseSidebar={onCloseSidebar} />

      <SidebarSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {renderTabBar()}

      {/* Divider under tabs */}
      <div className="mx-4 md:mx-5 flex-shrink-0" style={{ borderBottom: `1px solid ${border}` }} />

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 md:px-4 py-3">
        {activeTab === 'Chats' ? renderMyChats() : (
          <GlobalRoomList
            currentRoom={currentRoom}
            handleJoinRoom={handleJoinRoom}
            searchQuery={searchQuery}
          />
        )}
      </div>

      {/* Create Room — only in Chats tab, only non-guest */}
      {activeTab === 'Chats' && user.role !== 'guest' && (
        <div className="px-3 md:px-4 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${border}` }}>
          <button
            onClick={() => setShowCreateForm(f => !f)}
            className="w-full py-2.5 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
            {...getNeumorphicProps(1, 3, 2, 5)}
            style={{ ...getNeumorphicProps(1, 3, 2, 5).style, color: theme.otherMessageText }}
          >
            <Plus className="w-3.5 h-3.5" style={{ color: theme.otherUsernameColor }} />
            New Room
            {showCreateForm
              ? <ChevronUp className="w-3 h-3 ml-auto opacity-40" />
              : <ChevronDown className="w-3 h-3 ml-auto opacity-40" />
            }
          </button>
          {showCreateForm && (
            <div className="mt-2">
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
