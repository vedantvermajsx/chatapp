import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';

const PrivateChat = memo(function PrivateChat({
  chat,
  currentPrivateChat,
  handleStartPrivateChat,
  handleDeletePrivateChat,
  unread
}) {
  const { theme } = useTheme();
  const chatId = chat.otherUser.id || chat.otherUser._id;
  const isActive = currentPrivateChat?.id === chatId;

  return (
    <div
      className="group relative mx-1 my-0.5 cursor-pointer transition-all"
      onClick={() => handleStartPrivateChat({ ...chat.otherUser, id: chatId })}
    >
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-150`}
        style={{
          height: isActive ? '20px' : unread > 0 ? '8px' : '0px',
          backgroundColor: unread > 0 || isActive ? (theme.isLight ? '#4e5058' : '#f2f3f5') : 'transparent',
        }}
      />
      <div
        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md ml-1 transition-colors duration-100`}
        style={{
          backgroundColor: isActive
            ? (theme.isLight ? 'rgba(78,80,88,0.16)' : 'rgba(79,84,92,0.32)')
            : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = theme.isLight
              ? 'rgba(78,80,88,0.10)'
              : 'rgba(79,84,92,0.24)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isActive
            ? (theme.isLight ? 'rgba(78,80,88,0.16)' : 'rgba(79,84,92,0.32)')
            : 'transparent';
        }}
      >
        <div className="flex-shrink-0 relative">
          <Avatar
            url={chat.otherUser.avatar}
            name={chat.otherUser.username}
            gender={chat.otherUser.gender}
            size={8}
            mdSize={8}
            isOnline={chat.otherUser.isOnline}
            lastSeen={chat.otherUser.lastSeen}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className="font-semibold text-[15px] truncate leading-tight"
              style={{
                color: isActive
                  ? (theme.isLight ? '#060607' : '#f2f3f5')
                  : unread > 0
                      ? (theme.isLight ? '#313338' : '#dbdee1')
                      : (theme.isLight ? '#4e5058' : '#949ba4'),
              }}
            >
              {chat.otherUser.username}
            </h3>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <span
                  className="flex-shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{
                    backgroundColor: '#f23f43',
                    color: '#ffffff',
                  }}
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
              <button
                onClick={(e) => handleDeletePrivateChat(chatId, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity flex-shrink-0 translate-y-2"
                title="Delete Chat"
                style={{ color: theme.isLight ? '#b5bac1' : '#4e5058' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p
            className="text-[13px] truncate leading-tight mt-0.5"
            style={{
              color: unread > 0
                ? (theme.isLight ? '#313338' : '#dbdee1')
                : (theme.isLight ? '#7d8088' : '#6d727c'),
              fontWeight: unread > 0 ? 600 : 400,
            }}
          >
            {unread > 0
              ? `${unread} new`
              : (chat.lastMessage?.content
                  ? chat.lastMessage.content.replace('__SYSTEM_CALL__', '')
                  : 'No messages yet')
            }
          </p>
        </div>
      </div>
    </div>
  );
});

export default PrivateChat;
