import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';

export default function emitUserJoinedRoom(roomId, data) {
  const io = getIO();
  if (io) {
    io.to(roomId).emit('userJoinedRoom', data);
  }
  publish('userJoinedRoom', { roomId, data });
}
