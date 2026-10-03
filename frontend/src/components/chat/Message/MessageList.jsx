import { memo, useEffect, useRef } from 'react';
import Message from './Message';
import SwipeToReply from './SwipeToReply';
import SystemMessage from './SystemMessage';
import Spinner from '../../common/Spinner';
import TypingIndicator from './TypingIndicator';
import { useTheme } from '../../../contexts/ThemeContext';
import { isSameDay, formatDateSeparator } from '../../../utils/dateUtils';

const MessageList = ({
  messagesContainerRef,
  handleScroll,
  hasMoreMessages,
  hasMoreNewerMessages,
  loadingMessages,
  loadingNewerMessages,
  messages,
  currentUser,
  messagesEndRef,
  isPrivateChat,
  topPadding = 64,
  onLastMessageVisible,
  onLastMessageVisiblePagination,
  onFirstMessageVisible,
  typingIndicator,
  isFetchingOlder,
  onReplyClick,
  onReplyQuoteClick,
}) => {
  const { theme } = useTheme();
  const observerRef = useRef(null);
  const lastMsgElRef = useRef(null);
  const firstMsgObserverRef = useRef(null);
  const firstMsgElRef = useRef(null);
  const lastMsgPaginationObserverRef = useRef(null);
  const lastMsgPaginationRef = useRef(null);

  const lastNonOwnIndex = (() => {
    if (!messages) return -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!messages[i].isOwn && !messages[i].isSystemMessage) return i;
    }
    return -1;
  })();

  const firstMessageIndex = hasMoreMessages && messages.length > 3 ? 3 : (hasMoreMessages && messages.length > 0 ? 0 : -1);
  const lastMessagePaginationIndex = hasMoreNewerMessages && messages.length > 3 ? messages.length - 4 : (hasMoreNewerMessages && messages.length > 0 ? messages.length - 1 : -1);

  useEffect(() => {
    if (!onLastMessageVisible || lastNonOwnIndex === -1) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLastMessageVisible(messages[lastNonOwnIndex] ?? null);
        }
      },
      {
        root: messagesContainerRef.current,
        threshold: 0.6,
      }
    );

    if (lastMsgElRef.current) observerRef.current.observe(lastMsgElRef.current);

    return () => observerRef.current?.disconnect();
  }, [
    lastNonOwnIndex,
    messages,
    onLastMessageVisible,
    messagesContainerRef,
  ]);


  useEffect(() => {
    if (!onFirstMessageVisible) return;
    if (firstMessageIndex === -1) return;
    if (loadingMessages) return;

    firstMsgObserverRef.current?.disconnect();

    firstMsgObserverRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onFirstMessageVisible();
        }
      },
      {
        root: messagesContainerRef.current,
        threshold: 0,
        rootMargin: "100px 0px 0px 0px",
      }
    );

    if (firstMsgElRef.current) {
      firstMsgObserverRef.current.observe(firstMsgElRef.current);
    }

    return () => firstMsgObserverRef.current?.disconnect();
  }, [
    messages,
    firstMessageIndex,
    loadingMessages,
    hasMoreMessages,
    onFirstMessageVisible,
    messagesContainerRef,
  ]);

  useEffect(() => {
    if (!onLastMessageVisiblePagination) return;
    if (lastMessagePaginationIndex === -1) return;
    if (loadingNewerMessages) return;

    lastMsgPaginationObserverRef.current?.disconnect();

    lastMsgPaginationObserverRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLastMessageVisiblePagination();
        }
      },
      {
        root: messagesContainerRef.current,
        threshold: 0,
        rootMargin: "0px 0px 100px 0px",
      }
    );

    if (lastMsgPaginationRef.current) {
      lastMsgPaginationObserverRef.current.observe(lastMsgPaginationRef.current);
    }

    return () => lastMsgPaginationObserverRef.current?.disconnect();
  }, [
    messages,
    lastMessagePaginationIndex,
    loadingNewerMessages,
    hasMoreNewerMessages,
    onLastMessageVisiblePagination,
    messagesContainerRef,
  ]);

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto hide-scrollbar"
      style={{
        backgroundColor: theme.background,
        padding: `${topPadding + 8}px 0 8px`,
        overflowAnchor: 'none',
        '--scrollbar-thumb': theme.isLight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.22)',
        '--scrollbar-thumb-hover': theme.isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
      }}
    >
      {isFetchingOlder && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}

      {loadingMessages ? (
        <div className="flex justify-center items-center h-full">
          <Spinner />
        </div>
      ) : (
        <div role="log" aria-live="polite" aria-label="Messages">
          {messages.map((msg, idx) => {
            const prev = messages[idx - 1];
            const grouped = !!prev && !prev.isSystemMessage && !msg.isSystemMessage
              && prev.username === msg.username && !!prev.isOwn === !!msg.isOwn
              && !msg.replyTo && !prev.media?.type?.includes('sticker') && msg.media?.type !== 'sticker'
              && (new Date(msg.timestamp) - new Date(prev.timestamp)) < 5 * 60 * 1000;
            const showDateSeparator = !prev || !isSameDay(prev.timestamp, msg.timestamp);

            return (
            <div key={msg.id || msg._id || idx} className="flex flex-col">
              {showDateSeparator && (
                <div className="flex justify-center my-4">
                  <span
                    className="px-3 py-1 text-xs font-medium rounded-full shadow-sm"
                    style={{
                      backgroundColor: theme.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                      color: theme.isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}
            <div
              data-msg-id={msg.id || msg._id}
              ref={(el) => {
                if (idx === lastNonOwnIndex) lastMsgElRef.current = el;
                if (idx === firstMessageIndex) firstMsgElRef.current = el;
                if (idx === lastMessagePaginationIndex) lastMsgPaginationRef.current = el;
              }}
              className={idx === messages.length - 1 ? 'animate-bubble-in' : ''}
            >
              {msg?.isSystemMessage ? <SystemMessage msg={msg} isPrivateChat={isPrivateChat} /> :
                <SwipeToReply disabled={msg.isPending} isOwn={false} onReply={() => onReplyClick?.(msg)}>
                  <Message
                    msg={msg}
                    isOwn={msg.isOwn}
                    senderAvatar={msg.avatar}
                    gender={msg.gender}
                    isPrivateChat={isPrivateChat}
                    progress={msg.uploadProgress}
                    grouped={grouped}
                    isTagged={msg.taggedUser && currentUser && (msg.taggedUser === currentUser._id || msg.taggedUser === currentUser.id)}
                    onReplyClick={onReplyClick}
                    onReplyQuoteClick={onReplyQuoteClick}
                  />
                </SwipeToReply>
              }
            </div>
            </div>
            );
          })}

          {typingIndicator?.active && (
            <TypingIndicator
              avatar={typingIndicator.avatar}
              name={typingIndicator.name}
              label={typingIndicator.label}
              charCount={typingIndicator.charCount}
            />
          )}
        </div>
      )}

      {loadingNewerMessages && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default memo(MessageList);