import { useEffect, useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import RoomSidebar from './chat/Sidebar/RoomSidebar';
import ChatArea from './chat/ChatArea';
import { useChatState } from '../hooks/useChatState';
import { useChatSocket } from '../hooks/useChatSocket';
import { CallProvider } from '../contexts/CallContext';
import CallOverlay from './chat/Call/CallOverlay';
import ChessWindow from './chat/Chess/ChessWindow';
import MinigameWindow from './chat/Minigames/MinigameWindow';
import { MINIGAME_COMMANDS, inviteText } from '../utils/minigames';
import { sendMessageHandler } from '../handlers/message/sendMessage.handler.js';

function Chat() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const chatState = useChatState(user);
  const {
    messages, setMessages,
    inputMessage, setInputMessage,
    selectedFile, setSelectedFile,
    taggedUserId, setTaggedUserId,
    replyingTo, setReplyingTo,
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
    joinedRooms,
    setJoinedRooms,
    setCurrentRoom,
    setHasMoreNewerMessages
  });

  const [showChess, setShowChess] = useState(false);
  const [chessJoinCode, setChessJoinCode] = useState(null);
  const [chessKey, setChessKey] = useState(0);
  const chessBusyRef = useRef(false);
  const showChessRef = useRef(false);
  showChessRef.current = showChess;
  const minigameRef = useRef(null); // current minigame window state (assigned below, next to the state)

  useEffect(() => {
    const onOpenChess = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      if (showChessRef.current && chessBusyRef.current) {
        toast.error('Finish or close your current chess game first.');
        return;
      }
      if (minigameRef.current) {
        toast.error('Close your minigame window first.');
        return;
      }
      setChessJoinCode(code);
      setChessKey((k) => k + 1);
      setShowChess(true);
    };
    window.addEventListener('open-chess', onOpenChess);
    return () => window.removeEventListener('open-chess', onOpenChess);
  }, []);
  const lastInvitedCodeRef = useRef(null);
  const chessCtxRef = useRef({});
  chessCtxRef.current = { currentRoom, currentPrivateChat, user, socket, setMessages, privateChats, setPrivateChats, messageCache };

  // Posts an invite message into whichever chat is currently open.
  const sendInviteText = useCallback((text) => {
    const c = chessCtxRef.current;
    if (!c.user || !(c.currentRoom || c.currentPrivateChat)) return false;
    sendMessageHandler(
      { preventDefault() { } },
      c.currentRoom,
      c.currentPrivateChat,
      c.user,
      text,
      () => { },            // don't touch what the user is typing
      c.socket,
      c.setMessages,
      c.privateChats,
      c.setPrivateChats,
      c.messageCache,
      null,
      () => { },
      null,
      () => { },
      null,
      () => { }
    );
    return true;
  }, []);

  const handleChessCreated = useCallback((code) => {
    if (!code || lastInvitedCodeRef.current === code) return;
    if (sendInviteText(`Join the chess game with code: ${code}`)) lastInvitedCodeRef.current = code;
  }, [sendInviteText]);

  // ── Minigames (tic-tac-toe / connect four / rock-paper-scissors) ──
  const [minigame, setMinigame] = useState(null); // { game, joinCode, key } | null
  minigameRef.current = minigame;
  const minigameBusyRef = useRef(false);
  const lastMinigameCodeRef = useRef(null);

  const openMinigame = useCallback((game, code) => {
    if (minigameRef.current && minigameBusyRef.current) {
      toast.error('Finish or close your current game first.');
      return;
    }
    if (showChessRef.current) {
      toast.error('Close your chess window first.');
      return;
    }
    minigameBusyRef.current = false;
    setMinigame({ game: game || null, joinCode: code || null, key: Date.now() });
  }, []);

  useEffect(() => {
    const onOpenMinigame = (e) => {
      const { game, code } = e.detail || {};
      if (game && code) openMinigame(game, code);
    };
    window.addEventListener('open-minigame', onOpenMinigame);
    return () => window.removeEventListener('open-minigame', onOpenMinigame);
  }, [openMinigame]);

  const handleMinigameCreated = useCallback((game, code) => {
    if (!game || !code || lastMinigameCodeRef.current === `${game}:${code}`) return;
    if (sendInviteText(inviteText(game, code))) lastMinigameCodeRef.current = `${game}:${code}`;
  }, [sendInviteText]);

  const handleSendMessage = (e) => {
    const typed = (inputMessage || '').trim().toLowerCase();
    if (!selectedFile && Object.prototype.hasOwnProperty.call(MINIGAME_COMMANDS, typed)) {
      e.preventDefault();
      setInputMessage('');
      openMinigame(MINIGAME_COMMANDS[typed], null);
      return;
    }
    if (typed === '/start-chess' && !selectedFile) {
      e.preventDefault();
      setInputMessage('');
      if (minigameRef.current) {
        toast.error('Close your minigame window first.');
        return;
      }
      setChessJoinCode(null);
      if (!showChess) setChessKey((k) => k + 1);
      setShowChess(true);
      return;
    }
    return sendMessage(e, socket);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };


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

  const hasActiveChat = !!(currentRoom || currentPrivateChat);
  const handleBackToList = useCallback(() => {
    setCurrentRoom(null);
    setCurrentPrivateChat(null);
    if (socket) socket.emit('clearActiveRoom');
  }, [setCurrentRoom, setCurrentPrivateChat, socket]);

  const roomIdRef = useRef(currentRoom?._id);
  const messagesRef = useRef(messages);
  const handleChatReadRef = useRef(handleChatRead);
  useEffect(() => { roomIdRef.current = currentRoom?._id; }, [currentRoom?._id]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { handleChatReadRef.current = handleChatRead; }, [handleChatRead]);

  useEffect(() => {
    if (!socket || !currentRoom?._id) return undefined;
    return () => {
      socket.emit('clearActiveRoom');
    };
  }, [socket, currentRoom?._id]);

  useEffect(() => {
    if (!socket) return undefined;
    const handleVisibility = () => {
      const roomId = roomIdRef.current;
      if (!roomId) return;
      if (document.visibilityState === 'hidden') {
        socket.emit('clearActiveRoom');
      } else if (document.visibilityState === 'visible') {
        const lastNonOwnMessage = [...messagesRef.current].reverse().find(m => !m.isOwn && !m.isSystemMessage) ?? null;
        if (lastNonOwnMessage) {
          handleChatReadRef.current(`room_${roomId}`, lastNonOwnMessage);
        } else {
          socket.emit('markRoomRead', { roomId });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [socket]);

  return (
    <div className="flex w-full h-dvh  max-h-dvh overflow-hidden relative" style={{ backgroundColor: theme.background }}>
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
        unreadCounts={unreadCounts}
        socket={socket}
      />

      <CallProvider socket={socket}>
        <CallOverlay />
        <div className={`${hasActiveChat ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 overflow-hidden`}>
          <ChatArea
            user={user}
            currentRoom={currentRoom}
            currentPrivateChat={currentPrivateChat}
            setCurrentRoom={setCurrentRoom}
            messages={messages}
            setMessages={setMessages}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            taggedUserId={taggedUserId}
            setTaggedUserId={setTaggedUserId}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            sendMessage={handleSendMessage}
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
            onToggleSidebar={handleBackToList}
            loadRoomMembers={loadRoomMembers}
            hasMoreMembers={hasMoreMembers}
            loadMoreRoomMembers={loadMoreRoomMembers}
            unreadCounts={unreadCounts}
            onChatRead={handleChatRead}
            onLeaveRoom={handleLeaveRoom}
            socket={socket}
            typingUsers={typingUsers}
            messageCache={messageCache}
          />
        </div>
      </CallProvider>

      {showChess && (
        <ChessWindow
          key={chessKey}
          username={user?.username}
          joinCode={chessJoinCode}
          onGameCreated={handleChessCreated}
          onActiveChange={(active) => { chessBusyRef.current = active; }}
          onClose={() => { chessBusyRef.current = false; setShowChess(false); }}
        />
      )}

      {minigame && (
        <MinigameWindow
          key={minigame.key}
          game={minigame.game}
          username={user?.username}
          joinCode={minigame.joinCode}
          onGameCreated={handleMinigameCreated}
          onActiveChange={(active) => { minigameBusyRef.current = active; }}
          onClose={() => { minigameBusyRef.current = false; setMinigame(null); }}
        />
      )}
    </div>
  );
}

export default Chat;
