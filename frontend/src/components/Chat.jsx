import { useEffect, useCallback, useRef } from 'react';
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
    loadMoreMessages,
    unreadCounts,
    setUnreadCounts
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
    loadRoomMembers,
    setUnreadCounts
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadRooms();
    loadPrivateChats();
  }, [user, navigate, searchQuery, loadRooms, loadPrivateChats]);

  const lastMarkedReadRef = useRef({});

  const handleChatRead = useCallback((chatKey, lastMessage) => {
    if (!socket || !chatKey || !user) return;
    if (chatKey.startsWith('private_') && lastMessage?.senderId && lastMessage?.id) {
      if (lastMarkedReadRef.current[chatKey] !== lastMessage.id) {
        lastMarkedReadRef.current[chatKey] = lastMessage.id;
        socket.emit('markRead', {
          senderId: lastMessage.senderId,
          receiverId: lastMessage.receiverId,
          messageId: lastMessage.id,
        });
      }
    }
    setUnreadCounts(prev => {
      if (!prev[chatKey]) return prev;
      const next = { ...prev };
      delete next[chatKey];
      return next;
    });
  }, [socket, user, setUnreadCounts]);


  useEffect(() => {
    const chatKey = currentRoom?._id
      ? `room_${currentRoom._id}`
      : currentPrivateChat?.id
        ? `private_${currentPrivateChat.id}`
        : null;
    if (!chatKey) return;
    const lastNonOwnMessage = [...messages].reverse().find(m => !m.isOwn && !m.isSystemMessage) ?? null;
    handleChatRead(chatKey, lastNonOwnMessage);
  }, [currentRoom?._id, currentPrivateChat?.id, handleChatRead, messages]);

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
          onChatRead={handleChatRead}
        />
      </CallProvider>
    </div>
  );
}

export default Chat;