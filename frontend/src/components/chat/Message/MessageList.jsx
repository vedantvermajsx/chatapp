import { memo, useEffect, useRef } from 'react';
import Message from './Message';
import SystemMessage from './SystemMessage';
import Spinner from '../../common/Spinner';
import TypingIndicator from './TypingIndicator';
import { useTheme } from '../../../contexts/ThemeContext';

const MessageList = ({
  messagesContainerRef,
  handleScroll,
  hasMoreMessages,
  loadingMessages,
  messages,
  messagesEndRef,
  isPrivateChat,
  topPadding = 64,
  onLastMessageVisible,
  typingIndicator,
}) => {
  const { theme } = useTheme();
  const observerRef = useRef(null);
  const lastMsgElRef = useRef(null);

  const lastNonOwnIndex = (() => {
    if (!messages) return -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!messages[i].isSystemMessage && !messages[i].isOwn) return i;
    }
    return -1;
  })();

  useEffect(() => {
    if (!onLastMessageVisible || lastNonOwnIndex === -1) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLastMessageVisible(messages[lastNonOwnIndex] ?? null);
        }
      },
      { threshold: 0.5 }
    );

    if (lastMsgElRef.current) observerRef.current.observe(lastMsgElRef.current);

    return () => observerRef.current?.disconnect();
  }, [lastNonOwnIndex, messages, onLastMessageVisible]);

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto custom-scrollbar"
      style={{
        backgroundColor: theme.background,
        padding: `${topPadding + 16}px 16px 16px`,
        '--scrollbar-thumb': theme.isLight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.22)',
        '--scrollbar-thumb-hover': theme.isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
      }}
    >
      {hasMoreMessages && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}

      {loadingMessages ? (
        <div className="flex justify-center items-center h-full">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              ref={idx === lastNonOwnIndex ? lastMsgElRef : null}
            >
              {msg?.isSystemMessage ? <SystemMessage msg={msg} /> :
                <Message
                  msg={msg}
                  isOwn={msg.isOwn}
                  senderAvatar={msg.avatar}
                  gender={msg.gender}
                  isPrivateChat={isPrivateChat}
                />
              }
            </div>
          ))}

          {typingIndicator?.active && (
            <TypingIndicator
              avatar={typingIndicator.avatar}
              name={typingIndicator.name}
              label={typingIndicator.label}
            />
          )}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default memo(MessageList);