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
    joinedRooms, setJoinedRooms,
    loadingJoinedRooms,
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
    hasMoreNewerMessages, setHasMoreNewerMessages,
    loadingNewerMessages,
    hasMoreMembers,
    showSidebar, setShowSidebar,
    messageCache,
    loadRooms,
    loadJoinedRooms,
    loadPrivateChats,
    loadRoomMembers,
    loadMoreRoomMembers,
    sendMessage,
    sendSticker,
    joinRoom,
    startPrivateChat,
    loadMoreMessages,
    loadNewerMessages,
    unreadCounts,
    setUnreadCounts
  } = chatState;

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const { socket, typingUsers } = useChatSocket(user, {
    currentRoom,
    currentPrivateChat,
    setCurrentPrivateChat,
    privateChats,
    setPrivateChats,
    setMessages,
    loadRooms,
    loadJoinedRooms,
    loadPrivateChats,
    messageCache,
    roomMembers,
    setRoomMembers,
    loadRoomMembers,
    setUnreadCounts,
    setJoinedRooms,
    setCurrentRoom,
    setHasMoreNewerMessages
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    Promise.all([loadJoinedRooms(), loadPrivateChats()]);
  }, [user, navigate]);

  const handleLeaveRoom = useCallback((roomId) => {
    setJoinedRooms(prev => prev.filter(r => r._id !== roomId));
  }, [setJoinedRooms]);






  const lastMarkedReadRef = useRef({});

  const handleChatRead = useCallback((chatKey, lastMessage) => {
    if (!socket || !chatKey || !user || !(lastMessage?.id || lastMessage?._id) || !lastMessage?.timestamp) return;

    const newMsgTime = new Date(lastMessage.timestamp).getTime();
    if (Number.isNaN(newMsgTime)) return;

    const prevMsgTime = lastMarkedReadRef.current[chatKey];
    const isNewer = prevMsgTime == null || newMsgTime > prevMsgTime;
    if (!isNewer) return;

    if (chatKey.startsWith('private_') && lastMessage.senderId) {
      lastMarkedReadRef.current[chatKey] = newMsgTime;
      socket.emit('markRead', {
        senderId: lastMessage.senderId,
        receiverId: lastMessage.receiverId,
        messageId: lastMessage.id || lastMessage._id,
        timestamp: lastMessage.timestamp,
      });
    }


    if (chatKey.startsWith('room_')) {
      const roomId = chatKey.replace('room_', '');
      lastMarkedReadRef.current[chatKey] = newMsgTime;
      socket.emit('markRoomRead', {
        roomId,
        messageId: lastMessage.id || lastMessage._id,
        timestamp: lastMessage.timestamp,
      });
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
    if (hasMoreNewerMessages) return;
    const lastNonOwnMessage = [...messages].reverse().find(m => !m.isOwn && !m.isSystemMessage) ?? null;
    handleChatRead(chatKey, lastNonOwnMessage);
  }, [currentRoom?._id, currentPrivateChat?.id, handleChatRead, messages, hasMoreNewerMessages]);

  return (
    <div className="flex w-full h-dvh h-svh max-h-dvh max-h-svh overflow-hidden relative" style={{ backgroundColor: theme.background }}>
      <RoomSidebar
        user={user}
        logout={logout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        rooms={rooms}
        joinedRooms={joinedRooms}
        setJoinedRooms={setJoinedRooms}
        loadingJoinedRooms={loadingJoinedRooms}
        currentRoom={currentRoom}
        currentPrivateChat={currentPrivateChat}
        setCurrentPrivateChat={setCurrentPrivateChat}
        joinRoom={(roomId, roomObject) => joinRoom(roomId, socket, roomObject)}
        onRoomCreated={(room) => joinRoom(room._id, socket, room)}
        setCurrentRoom={setCurrentRoom}
        loadJoinedRooms={loadJoinedRooms}
        startPrivateChat={(user) => startPrivateChat(user, socket)}
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
        unreadCounts={unreadCounts}
        socket={socket}
      />

      <CallProvider socket={socket}>
        <CallOverlay />
        <ChatArea
          user={user}
          currentRoom={currentRoom}
          currentPrivateChat={currentPrivateChat}
          setCurrentRoom={setCurrentRoom}
          messages={messages}
          setMessages={setMessages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          sendMessage={(e) => sendMessage(e, socket)}
          sendSticker={sendSticker}
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
          hasMoreNewerMessages={hasMoreNewerMessages}
          setHasMoreNewerMessages={setHasMoreNewerMessages}
          loadingNewerMessages={loadingNewerMessages}
          loadMoreMessages={loadMoreMessages}
          loadNewerMessages={loadNewerMessages}
          onToggleSidebar={() => setShowSidebar(s => !s)}
          loadRoomMembers={loadRoomMembers}
          hasMoreMembers={hasMoreMembers}
          loadMoreRoomMembers={loadMoreRoomMembers}
          unreadCounts={unreadCounts}
          onChatRead={handleChatRead}
          onLeaveRoom={handleLeaveRoom}
          socket={socket}
          typingUsers={typingUsers}
          messageCache={messageCache}
          showSidebar={showSidebar}
        />
      </CallProvider>
    </div>
  );
}

export default Chat;
