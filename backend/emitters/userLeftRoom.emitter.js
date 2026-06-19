import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';

export default function emitUserLeftRoom(roomId, data) {
  const io = getIO();
  if (io) {
    io.to(roomId).emit('userLeftRoom', data);
  }
  publish('userLeftRoom', { roomId, data });
}
