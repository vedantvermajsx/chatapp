import { userRooms } from '../socket.js';

export default function handleJoinRoom(socket, io) {
  return (data) => {
    const roomId = typeof data === 'object' ? data.roomId : data;
    socket.join(roomId);
    if (!userRooms.has(socket.id)) {
      userRooms.set(socket.id, []);
    }
    if (!userRooms.get(socket.id).includes(roomId)) {
      userRooms.get(socket.id).push(roomId);
    }
  };
}
