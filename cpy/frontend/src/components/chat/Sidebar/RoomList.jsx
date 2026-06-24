import { Users } from 'lucide-react';
import Spinner from '../../common/Spinner';
import Room from './Room';
import { useTheme } from '../../../contexts/ThemeContext';

const RoomList = ({ rooms, currentRoom, handleJoinRoom, loadingRooms, unreadCounts = {} }) => {
  const { theme } = useTheme();
  return (
    <div>
      <div className="flex items-center gap-2 font-bold text-xs md:text-sm mb-3 px-2" style={{ color: theme.otherUsernameColor }}>
        <Users className="w-3 h-3 md:w-4 md:h-4" /> Groups
      </div>
      <div className="space-y-2 md:space-y-3">
        {loadingRooms ? (
          <div className="p-4 md:p-8 flex justify-center">
            <Spinner />
          </div>
        ) : (
          rooms?.map((room) => (
            <Room key={room._id} room={room} currentRoom={currentRoom} handleJoinRoom={handleJoinRoom} unreadCounts={unreadCounts} />
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
