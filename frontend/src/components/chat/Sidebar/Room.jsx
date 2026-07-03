import { memo } from 'react';
import Avatar from '../../common/Avatar';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const Room = memo(function Room({ room, currentRoom, handleJoinRoom, unread = 0 }) {
    const { theme, getNeumorphicProps } = useNeumorphism();
    const isActive = currentRoom?._id === room._id;

    return (
        <div
            onClick={() => handleJoinRoom(room._id, room)}
            className={`p-3 rounded-2xl cursor-pointer transition-all`}
            style={room.isDeleted ? { opacity: 0.45 } : undefined}
            {...getNeumorphicProps(1, 2, 2, 3, isActive, true)}
        >
            <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0 mt-1">
                    <Avatar url={room.groupPic} name={room.groupName} size={10} mdSize={10} isGroup />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs md:text-sm truncate" style={{ color: theme.otherMessageText }}>
                            {room.groupName}
                        </h3>

                        <span className="text-[10px] -translate-x-4 translate-y-3 md:text-xs font-semibold" style={{ color: theme.otherUsernameColor }}>
                            {room.memberCount ?? 0}
                        </span>
                    </div>
                    <p className="text-xs truncate mt-1 font-medium" style={{
                        color: unread > 0 ? (theme.primary || '#6366f1') : theme.otherMessageText,
                        opacity: unread > 0 ? 1 : 0.8,
                    }}>
                        {unread > 0
                            ? `${unread > 99 ? '99+' : unread > 9 ? '9+' : unread} new message${unread === 1 ? '' : 's'}`
                            : room.groupDescription
                        }
                    </p>
                </div>
            </div>
        </div>
    );
});

export default Room;