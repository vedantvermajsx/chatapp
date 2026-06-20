import { MessageCircle, X } from 'lucide-react';
import Spinner from '../../common/Spinner';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatLastSeenShort } from '../../../utils/dateUtils';

const PrivateChatList = ({ privateChats, currentPrivateChat, handleStartPrivateChat, loadingPrivateChats, handleDeletePrivateChat }) => {
  const { theme } = useTheme();
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
          privateChats.map((chat) => (
            <div
              key={chat.otherUser.id}
              onClick={() => handleStartPrivateChat(chat.otherUser)}
              className="p-3 md:p-5 rounded-2xl cursor-pointer transition-all"
              style={{ 
                backgroundColor: theme.background,
                boxShadow: currentPrivateChat?.id === chat.otherUser.id
                  ? (isLight ? 'inset 3px 3px 6px rgba(0,0,0,0.1), inset -3px -3px 6px rgba(255,255,255,0.8)' : 'inset 3px 3px 6px rgba(0,0,0,0.4), inset -3px -3px 6px rgba(255,255,255,0.05)')
                  : (isLight ? '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)' : '2px 2px 4px rgba(0,0,0,0.4), -2px -2px 4px rgba(255,255,255,0.05)')
              }}
              onMouseEnter={(e) => {
                if (currentPrivateChat?.id !== chat.otherUser.id) {
                  e.currentTarget.style.boxShadow = isLight
                    ? '3px 3px 6px rgba(0,0,0,0.15), -3px -3px 6px rgba(255,255,255,0.9)'
                    : '3px 3px 6px rgba(0,0,0,0.5), -3px -3px 6px rgba(255,255,255,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPrivateChat?.id !== chat.otherUser.id) {
                  e.currentTarget.style.boxShadow = isLight
                    ? '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)'
                    : '2px 2px 4px rgba(0,0,0,0.4), -2px -2px 4px rgba(255,255,255,0.05)';
                }
              }}
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
                    <span className="text-[10px] md:text-xs flex-shrink-0" style={{ color: theme.otherUsernameColor }}>
                      {chat.otherUser.isOnline ? 'Online' : formatLastSeenShort(chat.otherUser.lastSeen)}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm truncate mt-1 md:mt-2" style={{ color: theme.otherMessageText, opacity: 0.8 }}>
                    {chat.lastMessage?.content || 'Start a conversation'}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeletePrivateChat(chat.otherUser.id, e)}
                  className="p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity"
                  title="Delete Chat"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PrivateChatList;
