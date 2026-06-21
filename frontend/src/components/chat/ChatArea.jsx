import MembersPanel from './Members/MembersPanel';
import { useCallback, useRef, useEffect, useState, useLayoutEffect, memo } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './Message/MessageList';
import ChatInput from './ChatInput/ChatInput';
import { ImageZoomModal } from './Modals/ImageZoomModal';
import { useTheme } from '../../contexts/ThemeContext';

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
  loadMoreRoomMembers
}) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const chatInputRef = useRef(null);
  const prevLastMessageId = useRef(null);
  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [containerHeight, setContainerHeight] = useState(null);
  const [offsetTop, setOffsetTop] = useState(0);
  const { theme } = useTheme();

  const oldScrollHeight = useRef(0);
  const oldFirstMessageId = useRef(null);

  useEffect(() => {
    if (!window.visualViewport) return;

    const update = () => {
      setContainerHeight(window.visualViewport.height + window.visualViewport.offsetTop);
      setOffsetTop(window.visualViewport.offsetTop);


      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
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

  const handleSendMessage = useCallback(async (e) => {
    await sendMessage(e);
  }, [sendMessage]);

  if (messages.length > 0 && messagesContainerRef.current) {
    const currentFirstMsgId = messages[0].id;
    if (oldFirstMessageId.current !== null && oldFirstMessageId.current !== currentFirstMsgId) {
      const isPrepend = messages.some((m, idx) => idx > 0 && m.id === oldFirstMessageId.current);
      if (isPrepend) {
        oldScrollHeight.current = messagesContainerRef.current.scrollHeight;
      }
    }
  }

  useLayoutEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current && oldScrollHeight.current > 0) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const heightDifference = newScrollHeight - oldScrollHeight.current;
      if (heightDifference > 0) {
        messagesContainerRef.current.scrollTop += heightDifference;
      }
      oldScrollHeight.current = 0;
    }

    if (messages.length > 0) {
      oldFirstMessageId.current = messages[0].id;
    } else {
      oldFirstMessageId.current = null;
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || !hasMoreMessages || loadingMessages) return;
    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop < 150) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loadMoreMessages, loadingMessages]);

  useEffect(() => {
    if (!loadingMessages) {
      if (messages.length === 0) {
        prevLastMessageId.current = null;
      } else {
        const lastMessage = messages[messages.length - 1];
        if (prevLastMessageId.current !== lastMessage.id) {
          scrollToBottom();
          prevLastMessageId.current = lastMessage.id;
        }
      }
    }
  }, [messages, loadingMessages, scrollToBottom]);

  useEffect(() => {
    const handleOpenZoom = (e) => {
      setZoomImageUrl(e.detail.url);
    };
    window.addEventListener('openImageZoom', handleOpenZoom);
    return () => {
      window.removeEventListener('openImageZoom', handleOpenZoom);
    };
  }, []);

  return (
    <div
      className="flex-1 flex flex-col min-w-0 overflow-hidden overflow-y-hidden relative"
      style={{
        backgroundColor: theme.background,
        height: containerHeight != null ? `${containerHeight}px` : undefined,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 z-30"
        style={{ transform: `translateY(${offsetTop}px)` }}
      >
        <ChatHeader
          user={user}
          currentRoom={currentRoom}
          currentPrivateChat={currentPrivateChat}
          onToggleSidebar={onToggleSidebar}
          loadRoomMembers={loadRoomMembers}
          setShowMembersModal={setShowMembersModal}
          setCurrentRoom={setCurrentRoom}
          leaveRoomSocket={leaveRoomSocket}
        />
      </div>

      <div className="flex-1 min-h-0 h-full pt-[73px] sm:pt-[97px]">
        <MessageList
          messagesContainerRef={messagesContainerRef}
          handleScroll={handleScroll}
          hasMoreMessages={hasMoreMessages}
          loadingMessages={loadingMessages}
          messages={messages}
          messagesEndRef={messagesEndRef}
        />
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
        />
      </div>

      <MembersPanel
        show={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        members={roomMembers}
        admin={currentRoom?.groupAdmin}
        onStartPrivateChat={onStartPrivateChat}
        currentUserId={user.id}
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
