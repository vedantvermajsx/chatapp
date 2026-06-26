import { memo } from 'react';
import { Users } from 'lucide-react';
import Spinner from '../../common/Spinner';
import Room from './Room';
import { useTheme } from '../../../contexts/ThemeContext';

const RoomList = memo(function RoomList({
  rooms,
  currentRoom,
  handleJoinRoom,
  loadingRooms,
  unreadCounts = {},
  label = 'Groups',
  emptyText = '',
}) {
  const { theme } = useTheme();

  return (
    <div>
      <div className="flex items-center gap-2 font-bold text-xs md:text-sm mb-3 px-2" style={{ color: theme.otherUsernameColor }}>
        <Users className="w-3 h-3 md:w-4 md:h-4" /> {label}
      </div>
      <div className="space-y-2 md:space-y-3">
        {loadingRooms ? (
          <div className="p-4 md:p-8 flex justify-center">
            <Spinner />
          </div>
        ) : rooms?.length === 0 ? (
          emptyText ? (
            <p className="text-xs text-center py-2 opacity-50" style={{ color: theme.otherMessageText }}>
              {emptyText}
            </p>
          ) : null
        ) : (
          rooms?.map((room) => (
            <Room
              key={room._id}
              room={room}
              currentRoom={currentRoom}
              handleJoinRoom={handleJoinRoom}
              unread={unreadCounts[`room_${room._id}`] || 0}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default RoomList;