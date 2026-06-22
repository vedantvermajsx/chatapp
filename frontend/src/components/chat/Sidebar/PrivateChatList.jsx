import { MessageCircle, Trash2 } from 'lucide-react';
import Spinner from '../../common/Spinner';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNeumorphism } from '../../../hooks/useNeumorphism';
import { formatLastSeenShort } from '../../../utils/dateUtils';

const PrivateChatList = ({ privateChats, currentPrivateChat, handleStartPrivateChat, loadingPrivateChats, handleDeletePrivateChat, unreadCounts = {} }) => {
  const { theme } = useTheme();
  const { getNeumorphicProps } = useNeumorphism();
  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  return (
    <div className="pt-4">
      {privateChats.length > 0 && <div className="border-t mb-4" style={{ borderColor: isLight ? '#cbd5e0' : '#4a5568' }} />}
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
            const unread = unreadCounts[`private_${chat.otherUser.id}`] || 0;
            return (
              <div
                key={chat.otherUser.id}
                onClick={() => handleStartPrivateChat(chat.otherUser)}
                className="p-3 md:p-5 rounded-2xl cursor-pointer transition-all"
                {...getNeumorphicProps(2, 4, 3, 6, currentPrivateChat?.id === chat.otherUser.id, true)}
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
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {unread > 0 && (
                          <span className="min-w-[1.1rem] h-[1.1rem] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                        <span className="text-[10px] md:text-xs" style={{ color: theme.otherUsernameColor }}>
                          {chat.otherUser.isOnline ? 'Online' : formatLastSeenShort(chat.otherUser.lastSeen)}
                        </span>
                      </div>
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
                    onClick={(e) => handleDeletePrivateChat(chat.otherUser.id, e)}
                    className="p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity self-center flex-shrink-0"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PrivateChatList;