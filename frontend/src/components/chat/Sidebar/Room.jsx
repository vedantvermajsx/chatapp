import { memo } from 'react';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';

const Room = memo(function Room({ room, currentRoom, handleJoinRoom, unread = 0 }) {
    const { theme } = useTheme();
    const isActive = currentRoom?._id === room._id;
    const accent = theme.myMessageBubble || '#5865f2';

    return (
        <div
            role="button"
            tabIndex={0}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`${room.groupName}${unread > 0 ? `, ${unread} unread` : ''}${room.isDeleted ? ', deleted' : ''}`}
            onClick={() => handleJoinRoom(room._id, room)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleJoinRoom(room._id, room); } }}
            className={`group relative mx-1 my-0.5 cursor-pointer transition-all`}
            style={room.isDeleted ? { opacity: 0.45 } : undefined}
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
                <div className="flex-shrink-0">
                    <Avatar url={room.groupPic} name={room.groupName} size={8} mdSize={8} isGroup />
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
                            {room.groupName}
                        </h3>
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
                            : room.isDeleted
                                ? 'Deleted'
                                : (room.memberCount ? `${room.memberCount} members` : '')
                        }
                    </p>
                </div>
            </div>
        </div>
    );
});

export default Room;