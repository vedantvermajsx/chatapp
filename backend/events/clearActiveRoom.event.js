import { activeRooms } from '../socket.js';

const handleClearActiveRoom = (socket) => () => {
  const userId = socket.user._id || socket.user.id;
  activeRooms.delete(String(userId));
};

export default handleClearActiveRoom;
