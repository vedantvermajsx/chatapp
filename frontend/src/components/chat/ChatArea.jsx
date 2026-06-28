import MembersPanel from './Members/MembersPanel';
import { useCallback, useRef, useEffect, useState, useLayoutEffect, memo } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './Message/MessageList';
import ChatInput from './ChatInput/ChatInput';
import { ImageZoomModal } from './Modals/ImageZoomModal';
import { useTheme } from '../../contexts/ThemeContext';
import { dbService } from '../../services/indexedDB.service.js';

const ChatArea = memo(function ChatArea({
  user,
  currentRoom,
  currentPrivateChat,
  setCurrentRoom,
  messages,
  inputMessage,
  setInputMessage,
  selectedFile,
  onFileSelect,
  onRemoveFile,
  sendMessage,
  leaveRoomSocket,
  showMembersModal,
  setShowMembersModal,
  roomMembers,
  setRoomMembers,
  loadingRoomMembers,
  setLoadingRoomMembers,
  onStartPrivateChat,
  loadingMessages,
  hasMoreMessages,
  loadMoreMessages,
  onToggleSidebar,
  loadRoomMembers,
  hasMoreMembers,
  loadMoreRoomMembers,
  unreadCounts = {},
  onChatRead,
  onLeaveRoom,
  socket,
  typingUsers = {}
}) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const chatInputRef = useRef(null);
  const chatHeaderRef = useRef(null);
  const prevLastMessageId = useRef(null);
  const isUserAtBottom = useRef(true);
  const wasAwayFromChat = useRef(false);
  const prevChatKey = useRef(null);
  const oldScrollHeight = useRef(0);
  const oldFirstMessageId = useRef(null);
  const scrollPositions = useRef({});
  const activeChatKeyRef = useRef(null);
  const scrollSaveTimers = useRef({});

  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [containerHeight, setContainerHeight] = useState(null);
  const [offsetTop, setOffsetTop] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(64);
  const [isFading, setIsFading] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [showNewMsgBanner, setShowNewMsgBanner] = useState(false);

  const { theme } = useTheme();

  useEffect(() => {
    if (!chatHeaderRef.current) return;
    const ro = new ResizeObserver(([entry]) => setHeaderHeight(entry.contentRect.height));
    ro.observe(chatHeaderRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!window.visualViewport) return;
    const update = () => {
      setContainerHeight(window.visualViewport.height);
      setOffsetTop(window.visualViewport.offsetTop);
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    update();
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    return () => {
      window.visualViewport.removeEventListener('resize', update);
      window.visualViewport.removeEventListener('scroll', update);
    };
  }, []);

  const persistScrollPosition = useCallback((key, value) => {
    if (key == null) return;
    if (scrollSaveTimers.current[key]) clearTimeout(scrollSaveTimers.current[key]);
    scrollSaveTimers.current[key] = setTimeout(() => {
      dbService.saveScrollPosition(key, value);
    }, 400);
  }, []);

  const updateAtBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    isUserAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    const key = activeChatKeyRef.current;
    if (key != null) {
      scrollPositions.current[key] = el.scrollTop;
      persistScrollPosition(key, el.scrollTop);
    }
  }, [persistScrollPosition]);

  useEffect(() => {
    return () => {
      Object.values(scrollSaveTimers.current).forEach(clearTimeout);
      Object.entries(scrollPositions.current).forEach(([key, value]) => {
        dbService.saveScrollPosition(key, value);
      });
    };
  }, []);

  const getScrollPosition = useCallback(async (key) => {
    if (key == null) return null;
    if (scrollPositions.current[key] != null) return scrollPositions.current[key];
    try {
      const persisted = await dbService.getScrollPosition(key);
      if (persisted != null) scrollPositions.current[key] = persisted;
      return persisted;
    } catch {
      return null;
    }
  }, []);

  const chatKey = currentRoom?._id || currentPrivateChat?.id || null;

  const typingIndicator = (() => {
    if (currentPrivateChat) {
      const typingName = typingUsers[`private_${currentPrivateChat.id}`];
      if (!typingName) return { active: false };
      return {
        active: true,
        avatar: currentPrivateChat.avatar,
        name: currentPrivateChat.username,
        label: `${currentPrivateChat.username} is typing`,
      };
    }
    if (currentRoom) {
      const count = typingUsers[`room_${currentRoom._id}`];
      if (!count) return { active: false };
      return {
        active: true,
        avatar: currentRoom.groupPic,
        name: currentRoom.groupName,
        label: count === 1 ? 'Someone is typing' : `${count} people are typing`,
      };
    }
    return { active: false };
  })();

  const handleLastMessageVisible = useCallback((lastMessage) => {
    if (!onChatRead || chatKey == null) return;
    const key = currentRoom?._id ? `room_${currentRoom._id}` : `private_${currentPrivateChat.id}`;
    onChatRead(key, lastMessage);
  }, [onChatRead, chatKey, currentRoom?._id, currentPrivateChat?.id]);

  useEffect(() => {
    if (prevChatKey.current !== null && prevChatKey.current !== chatKey) {
      const leavingKey = prevChatKey.current;
      if (leavingKey != null && scrollPositions.current[leavingKey] != null) {
        if (scrollSaveTimers.current[leavingKey]) clearTimeout(scrollSaveTimers.current[leavingKey]);
        dbService.saveScrollPosition(leavingKey, scrollPositions.current[leavingKey]);
      }
      setIsFading(true);
      const t = setTimeout(() => setIsFading(false), 180);
      wasAwayFromChat.current = true;
      setNewMsgCount(0);
      setShowNewMsgBanner(false);
      prevLastMessageId.current = null;
      prevChatKey.current = chatKey;
      activeChatKeyRef.current = chatKey;
      return () => clearTimeout(t);
    }
    prevChatKey.current = chatKey;
    activeChatKeyRef.current = chatKey;
  }, [chatKey]);

  if (messages && messages.length > 0 && messagesContainerRef.current) {
    const currentFirstMsgId = messages[0].id;
    if (oldFirstMessageId.current !== null && oldFirstMessageId.current !== currentFirstMsgId) {
      const isPrepend = messages.some((m, idx) => idx > 0 && m.id === oldFirstMessageId.current);
      if (isPrepend) oldScrollHeight.current = messagesContainerRef.current.scrollHeight;
    }
  }

  useLayoutEffect(() => {
    if (messages && messages.length > 0 && messagesContainerRef.current && oldScrollHeight.current > 0) {
      const diff = messagesContainerRef.current.scrollHeight - oldScrollHeight.current;
      if (diff > 0) messagesContainerRef.current.scrollTop += diff;
      oldScrollHeight.current = 0;
    }
    oldFirstMessageId.current = messages && messages.length > 0 ? messages[0].id : null;
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current)
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    if (loadingMessages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (wasAwayFromChat.current) {
      wasAwayFromChat.current = false;
      prevLastMessageId.current = lastMessage.id;
      const awayKey = currentRoom?._id
        ? `room_${currentRoom._id}`
        : currentPrivateChat?.id
          ? `private_${currentPrivateChat.id}`
          : null;

      const awayUnread = awayKey ? (unreadCounts[awayKey] || 0) : 0;
      const applyRestore = (savedScrollTop) => {
        if (awayKey !== activeChatKeyRef.current) return;
        if (savedScrollTop != null && messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = savedScrollTop;
        } else {
          scrollToBottom();
        }
        updateAtBottom();
      };

      if (awayUnread > 0 && awayUnread < 3) {
        scrollToBottom();
      } else if (awayUnread >= 3) {
        setNewMsgCount(awayUnread);
        setShowNewMsgBanner(true);
        getScrollPosition(awayKey).then(applyRestore);
      } else {
        getScrollPosition(awayKey).then(applyRestore);
      }
      return;
    }

    if (prevLastMessageId.current === lastMessage.id) return;

    const isNewMsg = prevLastMessageId.current !== null;
    prevLastMessageId.current = lastMessage.id;

    if (!isNewMsg) {
      scrollToBottom();
      return;
    }

    if (isUserAtBottom.current || lastMessage.isOwn) {
      scrollToBottom();
      setShowNewMsgBanner(false);
      setNewMsgCount(0);
    } else {
      setNewMsgCount(prev => prev + 1);
      setShowNewMsgBanner(true);
    }
  }, [messages, loadingMessages, scrollToBottom, updateAtBottom, unreadCounts, currentRoom?._id, currentPrivateChat?.id, getScrollPosition]);

  const handleScroll = useCallback(() => {
    updateAtBottom();
    if (!messagesContainerRef.current || !hasMoreMessages || loadingMessages) return;
    if (messagesContainerRef.current.scrollTop < 150) loadMoreMessages();
  }, [hasMoreMessages, loadMoreMessages, loadingMessages, updateAtBottom]);

  const handleScrollWithBanner = useCallback(() => {
    handleScroll();
    if (isUserAtBottom.current) {
      setShowNewMsgBanner(false);
      setNewMsgCount(0);
    }
  }, [handleScroll]);

  const handleSendMessage = useCallback(async (e) => {
    await sendMessage(e);
  }, [sendMessage]);

  useEffect(() => {
    const handleOpenZoom = (e) => setZoomImageUrl(e.detail.url);
    window.addEventListener('openImageZoom', handleOpenZoom);
    return () => window.removeEventListener('openImageZoom', handleOpenZoom);
  }, []);

  useEffect(() => {
    if (typingIndicator.active && isUserAtBottom.current) {
      scrollToBottom();
    }
  }, [typingIndicator.active, scrollToBottom]);

  return (
    <div
      className="flex-1 flex flex-col min-w-0 relative overflow-hidden"
      style={{
        backgroundColor: theme.background,
        height: containerHeight != null ? `${containerHeight}px` : '100%',
        transform: offsetTop ? `translateY(${offsetTop}px)` : undefined,
      }}
    >
      <div ref={chatHeaderRef} className="absolute top-0 left-0 right-0 z-30">
        <ChatHeader
          user={user}
          currentRoom={currentRoom}
          currentPrivateChat={currentPrivateChat}
          onToggleSidebar={onToggleSidebar}
          loadRoomMembers={loadRoomMembers}
          setShowMembersModal={setShowMembersModal}
          setCurrentRoom={setCurrentRoom}
          leaveRoomSocket={leaveRoomSocket}
          onLeaveRoom={onLeaveRoom}
        />
      </div>

      <div
        className="flex-1 min-h-0 relative"
        style={{ opacity: isFading ? 0 : 1, transition: 'opacity 0.18s ease' }}
      >
        <MessageList
          messagesContainerRef={messagesContainerRef}
          handleScroll={handleScrollWithBanner}
          hasMoreMessages={hasMoreMessages}
          loadingMessages={loadingMessages}
          messages={messages}
          messagesEndRef={messagesEndRef}
          isPrivateChat={!!currentPrivateChat}
          topPadding={headerHeight}
          onLastMessageVisible={handleLastMessageVisible}
          typingIndicator={typingIndicator}
        />

        {showNewMsgBanner && (
          <button
            onClick={() => {
              scrollToBottom();
              setShowNewMsgBanner(false);
              setNewMsgCount(0);
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all"
            style={{
              backgroundColor: theme.primary || '#6366f1',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            }}
          >
            <span>↓ {newMsgCount > 99 ? '99+' : newMsgCount > 9 ? '9+' : newMsgCount} new message{newMsgCount === 1 ? '' : 's'}</span>
          </button>
        )}
      </div>

      <div className="flex-shrink-0 z-10 pb-[env(safe-area-inset-bottom)]">
        <ChatInput
          ref={chatInputRef}
          user={user}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          onRemoveFile={onRemoveFile}
          sendMessage={handleSendMessage}
          disabled={!currentRoom && !currentPrivateChat}
          onEmojiPickerToggle={setIsEmojiPickerOpen}
          socket={socket}
          currentRoom={currentRoom}
          currentPrivateChat={currentPrivateChat}
        />
      </div>

      <MembersPanel
        show={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        members={roomMembers}
        admin={currentRoom?.groupAdmin}
        onStartPrivateChat={onStartPrivateChat}
        currentUserId={user._id || user.id}
        loading={loadingRoomMembers}
        hasMoreMembers={hasMoreMembers}
        loadMoreRoomMembers={loadMoreRoomMembers}
        loadRoomMembers={loadRoomMembers}
      />

      <ImageZoomModal
        isOpen={!!zoomImageUrl}
        imageUrl={zoomImageUrl}
        onClose={() => setZoomImageUrl(null)}
      />
    </div>
  );
});

export default ChatArea;