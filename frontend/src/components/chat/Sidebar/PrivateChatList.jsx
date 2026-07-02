import { memo } from 'react';
import { MessageCircle } from 'lucide-react';
import Spinner from '../../common/Spinner';
import { useTheme } from '../../../contexts/ThemeContext';
import PrivateChat from './PrivateChat';

const PrivateChatList = memo(function PrivateChatList({ privateChats, currentPrivateChat, handleStartPrivateChat, loadingPrivateChats, handleDeletePrivateChat, unreadCounts = {} }) {
  const { theme } = useTheme();
  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  return (
    <div className="pt-4">
      {privateChats.length > 0 && <div className="mb-4" style={{ borderColor: isLight ? '#cbd5e0' : '#4a5568' }} />}
      <div className="flex items-center gap-2 font-bold text-xs md:text-sm mb-3 px-2" style={{ color: theme.otherUsernameColor }}>
        <MessageCircle className="w-3 h-3 md:w-4 md:h-4" /> Private Chats
      </div>
      <div className="space-y-2 md:space-y-3">
        {loadingPrivateChats ? (
          <div className="p-4 md:p-8 flex justify-center">
            <Spinner />
          </div>
        ) : (
          privateChats.map((chat) => {
            const chatUserId = chat.otherUser.id || chat.otherUser._id;
            const unread = unreadCounts[`private_${chatUserId}`] || 0;
            return (
              <PrivateChat
                key={chatUserId}
                chat={chat}
                currentPrivateChat={currentPrivateChat}
                handleStartPrivateChat={handleStartPrivateChat}
                handleDeletePrivateChat={handleDeletePrivateChat}
                unread={unread}
              />
            );
          })
        )}
      </div>
    </div>
  );
});

export default PrivateChatList;