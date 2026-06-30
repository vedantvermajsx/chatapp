import MembersPanel from './Members/MembersPanel';
import { useCallback, useRef, useEffect, useState, useLayoutEffect, memo } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './Message/MessageList';
import ChatInput from './ChatInput/ChatInput';
import { ImageZoomModal } from './Modals/ImageZoomModal';
import { useTheme } from '../../contexts/ThemeContext';
import { dbService } from '../../services/indexedDB.service.js';
import messageService from '../../services/message.service.js';

const ChatArea = memo(function ChatArea({
  user,
  currentRoom,
  currentPrivateChat,
  setCurrentRoom,
  messages,
  setMessages,
  inputMessage,
  setInputMessage,
  selectedFile,
  onFileSelect,
  onRemoveFile,
  sendMessage,
  sendSticker,
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
  hasMoreNewerMessages,
  setHasMoreNewerMessages,
  loadingNewerMessages,
  loadNewerMessages,
  onToggleSidebar,
  loadRoomMembers,
  hasMoreMembers,
  loadMoreRoomMembers,
  unreadCounts = {},
  onChatRead,
  onLeaveRoom,
  socket,
  typingUsers = {},
  messageCache
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
  const loadingOlderRef = useRef(false);
  const loadingNewerRef = useRef(false);
  const prevMessagesLength = useRef(0);
  const initialUnreadCountRef = useRef(0);
  const totalFetchedNewerRef = useRef(0);

  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const [zoomMedia, setZoomMedia] = useState(null);
  const [zoomMediaType, setZoomMediaType] = useState(null);
  const [containerHeight, setContainerHeight] = useState(null);
  const [offsetTop, setOffsetTop] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(64);
  const [isFading, setIsFading] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [showNewMsgBanner, setShowNewMsgBanner] = useState(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);

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

      if (isUserAtBottom.current) {
        requestAnimationFrame(() => {
          const el = messagesContainerRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        });
      }
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
      const typingData = typingUsers[`private_${currentPrivateChat.id}`];
      if (!typingData) return { active: false };
      return {
        active: true,
        avatar: currentPrivateChat.avatar,
        name: currentPrivateChat.username,
        label: `${currentPrivateChat.username} is typing`,
        charCount: typingData.charCount,
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
    initialUnreadCountRef.current = 0;
    totalFetchedNewerRef.current = 0;

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
    const currentFirstMsgId = messages[0]._id || messages[0].id;
    if (oldFirstMessageId.current !== null && oldFirstMessageId.current !== currentFirstMsgId) {
      const isPrepend = messages.some((m, idx) => idx > 0 && (m._id || m.id) === oldFirstMessageId.current);
      if (isPrepend) oldScrollHeight.current = messagesContainerRef.current.scrollHeight;
    }
  }

  useLayoutEffect(() => {
    if (messages && messages.length > 0 && messagesContainerRef.current && oldScrollHeight.current > 0) {
      const diff = messagesContainerRef.current.scrollHeight - oldScrollHeight.current;
      if (diff > 0) messagesContainerRef.current.scrollTop += diff;
      oldScrollHeight.current = 0;
    }
    oldFirstMessageId.current = messages && messages.length > 0 ? (messages[0]._id || messages[0].id) : null;
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current)
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    if (loadingMessages || messages.length === 0) {
      prevMessagesLength.current = messages ? messages.length : 0;
      return;
    }

    const messagesAdded = messages.length - prevMessagesLength.current;
    prevMessagesLength.current = messages.length;

    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage._id || lastMessage.id;

    if (wasAwayFromChat.current) {
      wasAwayFromChat.current = false;
      prevLastMessageId.current = lastMessageId;
      const awayKey = currentRoom?._id
        ? `room_${currentRoom._id}`
        : currentPrivateChat?.id
          ? `private_${currentPrivateChat.id}`
          : null;

      const awayUnread = awayKey ? (unreadCounts[awayKey] || 0) : 0;
      initialUnreadCountRef.current = awayUnread;
      totalFetchedNewerRef.current = 0;

      const applyRestore = (savedScrollTop) => {
        if (awayKey !== activeChatKeyRef.current) return;
        if (savedScrollTop != null && messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = savedScrollTop;
        } else {
          scrollToBottom();
        }
        updateAtBottom();
      };

      if (awayUnread > 0) {
        setNewMsgCount(awayUnread);
        setShowNewMsgBanner(true);
        getScrollPosition(awayKey).then(applyRestore);
      } else {
        getScrollPosition(awayKey).then(applyRestore);
      }
      return;
    }

    if (prevLastMessageId.current === lastMessageId) return;

    const isNewMsg = prevLastMessageId.current !== null;
    prevLastMessageId.current = lastMessageId;

    if (!isNewMsg) {
      scrollToBottom();
      return;
    }

    if (hasMoreNewerMessages || loadingNewerRef.current) {
      totalFetchedNewerRef.current += messagesAdded;
      const remainingUnread = Math.max(0, initialUnreadCountRef.current - totalFetchedNewerRef.current);
      setNewMsgCount(remainingUnread);
      setShowNewMsgBanner(remainingUnread > 0);
    }

    const shouldScrollToBottom = lastMessage.isOwn || (!hasMoreNewerMessages && !loadingNewerRef.current && isUserAtBottom.current);

    if (shouldScrollToBottom) {
      scrollToBottom();
      setShowNewMsgBanner(false);
      setNewMsgCount(0);
    } else if (!lastMessage.isOwn && !loadingNewerRef.current && !hasMoreNewerMessages) {
      if (messagesAdded <= 1) {
        setNewMsgCount(prev => {
          const next = prev + 1;
          setShowNewMsgBanner(next > 0);
          return next;
        });
      }
    }
  }, [messages, loadingMessages, scrollToBottom, updateAtBottom, unreadCounts, currentRoom?._id, currentPrivateChat?.id, getScrollPosition, hasMoreNewerMessages]);

  const handleLastMessagePaginationVisible = useCallback(async () => {
    if (
      loadingNewerRef.current ||
      loadingNewerMessages ||
      !hasMoreNewerMessages
    ) {
      return;
    }

    loadingNewerRef.current = true;

    try {
      await loadNewerMessages();
    } finally {
      setTimeout(() => {
        loadingNewerRef.current = false;
      }, 100);
    }
  }, [loadingNewerMessages, hasMoreNewerMessages, loadNewerMessages]);

  const handleFirstMessageVisible = useCallback(async () => {
    if (
      loadingOlderRef.current ||
      loadingMessages ||
      !hasMoreMessages
    ) {
      return;
    }

    loadingOlderRef.current = true;
    setIsFetchingOlder(true);

    try {
      await loadMoreMessages();
    } finally {
      setIsFetchingOlder(false);
      setTimeout(() => {
        loadingOlderRef.current = false;
      }, 300);
    }
  }, [loadingMessages, hasMoreMessages, loadMoreMessages]);


  const jumpToPresent = useCallback(async () => {
    if (loadingNewerRef.current || loadingNewerMessages) return;
    loadingNewerRef.current = true;
    try {
      let currentMessages = messages;
      let hasMore = hasMoreNewerMessages;
      let iterations = 0;
      const cacheKey = currentRoom?._id ? `room_${currentRoom._id}` : `private_${currentPrivateChat?.id}`;

      while (hasMore && iterations < 10) {
        const latestMessage = currentMessages[currentMessages.length - 1];
        if (!latestMessage) break;
        const after = latestMessage.timestamp;

        let res;
        if (currentRoom) {
          res = await messageService.getRoomMessages(currentRoom._id, 100, null, after);
        } else if (currentPrivateChat) {
          res = await messageService.getPrivateMessages(currentPrivateChat.id, 100, null, after);
        }

        if (!res || !res.messages || res.messages.length === 0) {
          hasMore = res?.hasMore || false;
          break;
        }

        const existingIds = new Set(currentMessages.map(m => String(m.id || m._id)));
        const reallyNew = res.messages.filter(m => !existingIds.has(String(m.id || m._id)));

        if (reallyNew.length > 0) {
          currentMessages = [...currentMessages, ...reallyNew];
          if (cacheKey) {
            await dbService.mergeNewMessages(cacheKey, reallyNew);
          }
        }

        hasMore = res.hasMore || false;
        iterations++;
      }

      if (cacheKey) {
        messageCache.current[cacheKey] = {
          messages: currentMessages,
          hasMore: hasMore,
          timestamp: Date.now(),
        };
      }

      setMessages(currentMessages);
      setHasMoreNewerMessages(hasMore);
      setShowNewMsgBanner(false);
      setNewMsgCount(0);

      setTimeout(() => {
        scrollToBottom();
      }, 50);
    } catch (error) {
      console.error('Failed to jump to present:', error);
    } finally {
      loadingNewerRef.current = false;
    }
  }, [messages, hasMoreNewerMessages, currentRoom, currentPrivateChat, loadingNewerMessages, scrollToBottom, setMessages, setHasMoreNewerMessages, messageCache]);


  const handleScrollWithBanner = useCallback(() => {
    updateAtBottom();

    if (isUserAtBottom.current) {
      setShowNewMsgBanner(false);
      setNewMsgCount(0);
      if (hasMoreNewerMessages && !loadingNewerMessages && !loadingNewerRef.current) {
        handleLastMessagePaginationVisible();
      }
    }
  }, [updateAtBottom, hasMoreNewerMessages, loadingNewerMessages, handleLastMessagePaginationVisible]);


  const handleSendMessage = useCallback(async (e) => {
    await sendMessage(e);
  }, [sendMessage]);

  useEffect(() => {
    const handleOpenZoom = (e) => {
      setZoomImageUrl(e.detail.url);
      setZoomMedia(e.detail.media || null);
      setZoomMediaType(e.detail.type || 'image');
    };
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
          currentUser={user}
          messagesEndRef={messagesEndRef}
          isPrivateChat={!!currentPrivateChat}
          topPadding={headerHeight}
          onLastMessageVisible={handleLastMessageVisible}
          onLastMessageVisiblePagination={handleLastMessagePaginationVisible}
          onFirstMessageVisible={handleFirstMessageVisible}
          typingIndicator={typingIndicator}
          hasMoreNewerMessages={hasMoreNewerMessages}
          loadingNewerMessages={loadingNewerMessages}
          isFetchingOlder={isFetchingOlder}
        />

        {showNewMsgBanner && (
          <button
            onClick={() => {
              if (hasMoreNewerMessages) {
                jumpToPresent();
              } else {
                scrollToBottom();
                setShowNewMsgBanner(false);
                setNewMsgCount(0);
              }
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
          onStickerSend={sendSticker}
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
        media={zoomMedia}
        mediaType={zoomMediaType}
        onClose={() => { setZoomImageUrl(null); setZoomMedia(null); setZoomMediaType(null); }}
      />
    </div>
  );
});

export default ChatArea;