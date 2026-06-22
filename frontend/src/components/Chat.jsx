import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import RoomSidebar from './chat/Sidebar/RoomSidebar';
import ChatArea from './chat/ChatArea';
import { useChatState } from '../hooks/useChatState';
import { useChatSocket } from '../hooks/useChatSocket';
import { CallProvider } from '../contexts/CallContext';
import CallOverlay from './chat/Call/CallOverlay';

function Chat() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const chatState = useChatState(user);
  const {
    messages, setMessages,
    inputMessage, setInputMessage,
    selectedFile, setSelectedFile,
    rooms,
    searchQuery, setSearchQuery,
    currentRoom, setCurrentRoom,
    currentPrivateChat, setCurrentPrivateChat,
    newRoomName, setNewRoomName,
    newRoomDesc, setNewRoomDesc,
    showCreateRoom, setShowCreateRoom,
    showMembersModal, setShowMembersModal,
    roomMembers, setRoomMembers,
    privateChats, setPrivateChats,
    loadingRooms,
    loadingPrivateChats,
    loadingMessages,
    loadingJoinRoom,
    loadingRoomMembers, setLoadingRoomMembers,
    hasMoreMessages,
    hasMoreMembers,
    showSidebar, setShowSidebar,
    messageCache,
    loadRooms,
    loadPrivateChats,
    loadRoomMembers,
    loadMoreRoomMembers,
    sendMessage,
    joinRoom,
    startPrivateChat,
    loadMoreMessages
  } = chatState;

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const socket = useChatSocket(user, {
    currentRoom,
    currentPrivateChat,
    setCurrentPrivateChat,
    privateChats,
    setPrivateChats,
    setMessages,
    loadRooms,
    loadPrivateChats,
    messageCache,
    roomMembers,
    setRoomMembers,
    loadRoomMembers
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadRooms();
    loadPrivateChats();
  }, [user, navigate, searchQuery, loadRooms, loadPrivateChats]);

  return (
    <div className="flex w-full h-dvh overflow-hidden overflow-y-hidden relative" style={{ backgroundColor: theme.background }}>
      <RoomSidebar
        user={user}
        logout={logout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        rooms={rooms}
        currentRoom={currentRoom}
        currentPrivateChat={currentPrivateChat}
        setCurrentPrivateChat={setCurrentPrivateChat}
        joinRoom={(roomId) => joinRoom(roomId, socket)}
        startPrivateChat={startPrivateChat}
        loadingJoinRoom={loadingJoinRoom}
        newRoomName={newRoomName}
        setNewRoomName={setNewRoomName}
        newRoomDesc={newRoomDesc}
        setNewRoomDesc={setNewRoomDesc}
        showCreateRoom={showCreateRoom}
        setShowCreateRoom={setShowCreateRoom}
        loadRooms={loadRooms}
        privateChats={privateChats}
        setPrivateChats={setPrivateChats}
        loadingRooms={loadingRooms}
        loadingPrivateChats={loadingPrivateChats}
        showSidebar={showSidebar}
        onCloseSidebar={() => setShowSidebar(false)}
      />

      <CallProvider socket={socket}>
        <CallOverlay />
        <ChatArea
          user={user}
          currentRoom={currentRoom}
          currentPrivateChat={currentPrivateChat}
          setCurrentRoom={setCurrentRoom}
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          sendMessage={(e) => sendMessage(e, socket)}
          leaveRoomSocket={(roomId) => socket.emit('leaveRoom', roomId)}
          showMembersModal={showMembersModal}
          setShowMembersModal={setShowMembersModal}
          roomMembers={roomMembers}
          setRoomMembers={setRoomMembers}
          loadingRoomMembers={loadingRoomMembers}
          setLoadingRoomMembers={setLoadingRoomMembers}
          onStartPrivateChat={startPrivateChat}
          loadingMessages={loadingMessages}
          hasMoreMessages={hasMoreMessages}
          loadMoreMessages={loadMoreMessages}
          onToggleSidebar={() => setShowSidebar(s => !s)}
          loadRoomMembers={loadRoomMembers}
          hasMoreMembers={hasMoreMembers}
          loadMoreRoomMembers={loadMoreRoomMembers}
          unreadCounts={unreadCounts}
        />
      </CallProvider>
    </div>
  );
}

export default Chat;