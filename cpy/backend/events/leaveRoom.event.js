import { userRooms } from '../socket.js';

export default function handleLeaveRoom(socket, io) {
  return (roomId) => {
    socket.leave(roomId);
    const rooms = userRooms.get(socket.id);
    if (rooms) {
      userRooms.set(socket.id, rooms.filter(r => r !== roomId));
    }
  };
}
