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
          height: isActive ? '20px' : '0px',
          backgroundColor: isActive ? theme.otherMessageText : 'transparent',
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
        {/* Avatar */}
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
          <h3
            className="font-semibold text-[15px] truncate leading-tight"
            style={{
              color: isActive
                ? theme.otherMessageText
                : unread > 0
                  ? theme.otherMessageText
                  : theme.muted,
            }}
          >
            {chat.otherUser.username}
          </h3>
          <p
            className="text-[13px] truncate leading-tight mt-0.5"
            style={{
              color: unread > 0
                ? theme.otherMessageText
                : theme.muted,
              fontWeight: unread > 0 ? 600 : 400,
            }}
          >
            {(() => {
              if (unread > 0) return `${unread} new ${unread === 1 ? 'message' : 'messages'}`;
              const msg = chat.lastMessage;
              if (!msg) return 'No messages yet';
              if (!msg.content && msg.media) {
                const t = msg.media?.type;
                if (t === 'image') return 'Photo';
                if (t === 'video') return 'Video';
                if (t === 'audio') return 'Audio';
                return 'Attachment';
              }
              if (!msg.content) return 'No messages yet';
              const text = msg.content.replace('__SYSTEM_CALL__', '');
              return text.length > 30 ? text.slice(0, 30) + '…' : text;
            })()}
          </p>
        </div>
        {unread > 0 && (
          <span
            className="flex-shrink-0 ml-1 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold leading-none"
            style={{ backgroundColor: '#d92d31', color: '#ffffff' }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {/* Delete button — always occupies the same space, no layout shift */}
        <div className="flex-shrink-0">
          <button
            onClick={(e) => handleDeletePrivateChat(chatId, e)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
            title="Delete Chat"
            style={{ color: theme.muted }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default PrivateChat;
