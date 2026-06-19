import { memo } from 'react';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';

const Room = memo(function Room({ room, currentRoom, handleJoinRoom }) {
    const { theme } = useTheme();
    const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
    return (
        <div
            onClick={() => handleJoinRoom(room._id)}
            className={`p-3 md:p-5 rounded-2xl cursor-pointer transition-all`}
            style={{
                backgroundColor: theme.background,
                boxShadow: currentRoom?._id === room._id
                    ? (isLight ? 'inset 3px 3px 6px rgba(0,0,0,0.1), inset -3px -3px 6px rgba(255,255,255,0.8)' : 'inset 3px 3px 6px rgba(0,0,0,0.4), inset -3px -3px 6px rgba(255,255,255,0.05)')
                    : (isLight ? '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)' : '2px 2px 4px rgba(0,0,0,0.4), -2px -2px 4px rgba(255,255,255,0.05)')
            }}
            onMouseEnter={(e) => {
                if (currentRoom?._id !== room._id) {
                    e.currentTarget.style.boxShadow = isLight
                        ? '3px 3px 6px rgba(0,0,0,0.15), -3px -3px 6px rgba(255,255,255,0.9)'
                        : '3px 3px 6px rgba(0,0,0,0.5), -3px -3px 6px rgba(255,255,255,0.08)';
                }
            }}
            onMouseLeave={(e) => {
                if (currentRoom?._id !== room._id) {
                    e.currentTarget.style.boxShadow = isLight
                        ? '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)'
                        : '2px 2px 4px rgba(0,0,0,0.4), -2px -2px 4px rgba(255,255,255,0.05)';
                }
            }}
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
                        <span className="text-[10px] md:text-xs font-semibold ml-2 flex-shrink-0" style={{ color: theme.otherUsernameColor }}>
                            {room.groupMembers.length}
                        </span>
                    </div>
                    <p className="text-xs md:text-sm truncate mt-1 md:mt-2" style={{ color: theme.otherMessageText, opacity: 0.8 }}>
                        {room.groupDescription}
                    </p>
                </div>
            </div>
        </div>

    );
});
export default Room;