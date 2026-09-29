import { Plus, ChevronDown, ChevronUp, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState, useEffect } from 'react';
import roomService from '../../../services/room.service';
import userService from '../../../services/user.service';
import { generateRsaKeyPairPem } from '../../../utils/crypto';
import RoomList from './RoomList';
import GlobalRoomList from './GlobalRoomList';
import PrivateChatList from './PrivateChatList';
import UserSearchRow from './UserSearchRow';
import Spinner from '../../common/Spinner';
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

  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const isUserSearch = activeTab === 'Explore' && searchQuery.trim().startsWith('@');

  useEffect(() => {
    if (!isUserSearch) {
      setUserResults([]);
      return;
    }
    const q = searchQuery.trim().slice(1);
    if (!q) {
      setUserResults([]);
      return;
    }
    setSearchingUsers(true);
    const t = setTimeout(async () => {
      try {
        const results = await userService.searchUsers(q, 5);
        setUserResults(Array.isArray(results) ? results.slice(0, 5) : []);
      } catch {
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [isUserSearch, searchQuery]);

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
      const { publicKeyPem, privateKeyPem } = await generateRsaKeyPairPem();
      const data = await roomService.createRoom(newRoomName, newRoomDesc, publicKeyPem, privateKeyPem);
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
    <div className="flex flex-shrink-0 px-2 py-1 gap-0.5">
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        const badge = tab === "Chats" && myChatsUnread > 0 ? myChatsUnread : 0;

        return (
          <button
            key={tab}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveTab(tab)}
            className="relative flex-1 py-1.5 px-2 rounded-md text-[15px] font-semibold transition-colors leading-tight"
            style={{
              color: isActive
                ? (theme.isLight ? '#060607' : '#f2f3f5')
                : (theme.isLight ? '#4e5058' : '#949ba4'),
              backgroundColor: isActive
                ? (theme.isLight ? 'rgba(78,80,88,0.16)' : 'rgba(79,84,92,0.32)')
                : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = theme.isLight
                  ? 'rgba(78,80,88,0.10)'
                  : 'rgba(79,84,92,0.24)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isActive
                ? (theme.isLight ? 'rgba(78,80,88,0.16)' : 'rgba(79,84,92,0.32)')
                : 'transparent';
            }}
          >
            <span className="inline-flex items-center justify-center gap-1.5 w-full">
              {tab}
              {badge > 0 && (
                <span
                  className="flex-shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ backgroundColor: '#f23f43', color: '#ffffff' }}
                >
                  {badge > 99 ? '99+' : badge}
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

  const myId = user?._id || user?.id;
  const people = userResults.filter((u) => u.id !== myId);

  const renderUserSearch = () => (
    <div>
      <div className="flex items-center gap-2 font-bold text-xs md:text-sm mb-3 px-2" style={{ color: theme.otherUsernameColor }}>
        <UsersIcon className="w-3 h-3 md:w-4 md:h-4" /> People
      </div>
      <div className="space-y-2 md:space-y-3">
        {searchingUsers && people.length === 0 ? (
          <div className="p-4 md:p-8 flex justify-center">
            <Spinner />
          </div>
        ) : people.length === 0 ? (
          <p className="text-xs text-center py-2 opacity-50" style={{ color: theme.otherMessageText }}>
            No users found
          </p>
        ) : (
          people.map((u) => (
            <UserSearchRow key={u.id} user={u} onStartPrivateChat={handleStartPrivateChat} />
          ))
        )}
      </div>
    </div>
  );

  const sidebarBg = theme.sidebarBg || theme.background;

  const renderSidebarContent = (showMobileClose) => (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: sidebarBg }}
    >
      <SidebarHeader showMobileClose={showMobileClose} onCloseSidebar={onCloseSidebar} />

      <SidebarSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {renderTabBar()}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-0.5 py-1">
        <div style={{ display: activeTab === 'Chats' ? 'block' : 'none' }}>
          {renderMyChats()}
        </div>
        <div style={{ display: activeTab === 'Explore' ? 'block' : 'none' }}>
          {isUserSearch ? renderUserSearch() : (
            <GlobalRoomList
              currentRoom={currentRoom}
              handleJoinRoom={handleJoinRoom}
              searchQuery={searchQuery}
              socket={socket}
              isActive={activeTab === 'Explore' && !isUserSearch}
            />
          )}
        </div>
      </div>

      {activeTab === 'Chats' && user.role !== 'guest' && (
        <div
          className="mx-2 my-1 flex-shrink-0"
          style={{ borderTop: `1px solid ${theme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.28)'}` }}
        >
          <button
            onClick={() => setShowCreateForm(f => !f)}
            className="w-full mt-2 py-1.5 px-2 rounded-md flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: theme.isLight ? '#4e5058' : '#949ba4',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.isLight
                ? 'rgba(78,80,88,0.10)'
                : 'rgba(79,84,92,0.24)';
              e.currentTarget.style.color = theme.isLight ? '#060607' : '#f2f3f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.isLight ? '#4e5058' : '#949ba4';
            }}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.myMessageBubble || '#5865f2' }}
            >
              <Plus className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold leading-tight">
              Create Room
            </span>
            {showCreateForm
              ? <ChevronUp className="w-4 h-4 ml-auto" />
              : <ChevronDown className="w-4 h-4 ml-auto" />
            }
          </button>
          {showCreateForm && (
            <div className="mt-2 px-2">
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
    </div>
  );

  const hasActiveChat = !!(currentRoom || currentPrivateChat);

  return (
    <>
      { }
      <div
        className={`${hasActiveChat ? 'hidden' : 'flex'} md:hidden flex-col w-full h-full flex-shrink-0`}
        style={{ backgroundColor: theme.background }}
      >
        {renderSidebarContent(false)}
      </div>

      <div
        className="hidden md:block w-72 lg:w-80 flex-shrink-0 border-r"
        style={{ backgroundColor: theme.background, borderColor: border }}
      >
        {renderSidebarContent(false)}
      </div>

      {showUserSettings && (
        <UserSettingsModal
          user={user}
          onClose={() => setShowUserSettings(false)}
          onUpdateSuccess={updateUser}
        />
      )}
    </>
  );
}

export default RoomSidebar;