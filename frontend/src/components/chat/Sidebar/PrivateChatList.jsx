import { memo, useState } from 'react';
import { ChevronDown, ChevronRight, AtSign } from 'lucide-react';
import Spinner from '../../common/Spinner';
import { useTheme } from '../../../contexts/ThemeContext';
import PrivateChat from './PrivateChat';

const PrivateChatList = memo(function PrivateChatList({ privateChats, currentPrivateChat, handleStartPrivateChat, loadingPrivateChats, handleDeletePrivateChat, unreadCounts = {} }) {
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const headerColor = theme.isLight ? '#4e5058' : '#949ba4';

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-0.5 px-2 py-1 group transition-colors"
        style={{ color: headerColor }}
        onMouseEnter={(e) => { e.currentTarget.style.color = theme.isLight ? '#060607' : '#f2f3f5'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = headerColor; }}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
          : <ChevronDown className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
        }
        <span className="text-[12px] font-bold uppercase tracking-wide leading-tight truncate">
          Direct Messages
        </span>
        <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <AtSign className="w-3 h-3" strokeWidth={2} />
        </span>
      </button>
      {!collapsed && (
        <div className="mt-0.5">
          {loadingPrivateChats ? (
            <div className="p-4 flex justify-center">
              <Spinner />
            </div>
          ) : privateChats.length === 0 ? (
            <p
              className="text-[13px] px-3 py-1.5 leading-tight"
              style={{ color: theme.isLight ? '#7d8088' : '#6d727c' }}
            >
              No conversations yet
            </p>
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
      )}
    </div>
  );
});

export default PrivateChatList;