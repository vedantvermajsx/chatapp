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
  isPrivateChat
}) => {
  const { theme } = useTheme();
  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto p-4 sm:p-6 space-y-4"
      style={{ backgroundColor: theme.background }}
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
        messages.map((msg) => (
          <Message key={msg.id} msg={msg} isOwn={msg.isOwn} senderAvatar={msg.avatar} gender={msg.gender} isPrivateChat={isPrivateChat} />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default memo(MessageList);
