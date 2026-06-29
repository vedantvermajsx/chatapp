import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const PrivateChat = memo(function PrivateChat({
  chat,
  currentPrivateChat,
  handleStartPrivateChat,
  handleDeletePrivateChat,
  unread
}) {
  const { theme } = useTheme();
  const { getNeumorphicProps } = useNeumorphism();

  return (
    <div
      onClick={() => handleStartPrivateChat({ ...chat.otherUser, id: chat.otherUser.id || chat.otherUser._id })}
      className="p-3 md:p-5 rounded-2xl cursor-pointer transition-all"
      {...getNeumorphicProps(2, 4, 3, 6, currentPrivateChat?.id === (chat.otherUser.id || chat.otherUser._id), true)}
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex-shrink-0">
          <Avatar
            url={chat.otherUser.avatar}
            name={chat.otherUser.username}
            gender={chat.otherUser.gender}
            size={8}
            mdSize={12}
            isOnline={chat.otherUser.isOnline}
            lastSeen={chat.otherUser.lastSeen}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-xs md:text-sm truncate" style={{ color: theme.otherMessageText }}>
              {chat.otherUser.username}
            </h3>

          </div>
          <p className="text-xs md:text-sm truncate mt-1 md:mt-2 font-medium" style={{
            color: unread > 0 ? (theme.primary || '#6366f1') : theme.otherMessageText,
            opacity: unread > 0 ? 1 : 0.8,
          }}>
            {unread > 0
              ? `${unread > 99 ? '99+' : unread > 9 ? '9+' : unread} new message${unread === 1 ? '' : 's'}`
              : (chat.lastMessage?.content ? chat.lastMessage.content.replace('__SYSTEM_CALL__', '') : 'Start a conversation')
            }
          </p>
        </div>
        <button
          onClick={(e) => handleDeletePrivateChat(chat.otherUser.id || chat.otherUser._id, e)}
          className="p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity self-center flex-shrink-0"
          title="Delete Chat"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
});

export default PrivateChat;
