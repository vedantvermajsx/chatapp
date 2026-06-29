import { memo } from 'react';
import Avatar from '../../common/Avatar';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const Room = memo(function Room({ room, currentRoom, handleJoinRoom, unread = 0 }) {
    const { theme, getNeumorphicProps } = useNeumorphism();
    const isActive = currentRoom?._id === room._id;

    return (
        <div
            onClick={() => handleJoinRoom(room._id, room)}
            className={`p-3 md:p-5 rounded-2xl cursor-pointer transition-all`}
            {...getNeumorphicProps(2, 4, 3, 6, isActive, true)}
        >
            <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0">
                    <Avatar url={room.groupPic} name={room.groupName} size={8} mdSize={12} isGroup />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs md:text-sm truncate" style={{ color: theme.otherMessageText }}>
                            {room.groupName}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">

                            <span className="text-[10px] md:text-xs font-semibold" style={{ color: theme.otherUsernameColor }}>
                                {room.memberCount ?? 0}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs md:text-sm truncate mt-1 md:mt-2 font-medium" style={{
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