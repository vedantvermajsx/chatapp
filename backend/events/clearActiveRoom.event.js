import { activeRooms } from '../socket.js';

/**
 * Socket event: clearActiveRoom
 * Called when the user navigates away from a room (e.g. opens a private chat).
 * Removes them from activeRooms so future room messages increment their unread.
 */
const handleClearActiveRoom = (socket) => () => {
  const userId = socket.user._id || socket.user.id;
  activeRooms.delete(String(userId));
};

export default handleClearActiveRoom;
