import { memo } from 'react';
import Message from './Message';
import Spinner from '../../common/Spinner';
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
}) => {
  const { theme } = useTheme();
  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto"
      style={{
        backgroundColor: theme.background,
        padding: `${topPadding + 16}px 16px 16px`,
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
          {messages.map((msg) => (
            <Message
              key={msg.id}
              msg={msg}
              isOwn={msg.isOwn}
              senderAvatar={msg.avatar}
              gender={msg.gender}
              isPrivateChat={isPrivateChat}
            />
          ))}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default memo(MessageList);