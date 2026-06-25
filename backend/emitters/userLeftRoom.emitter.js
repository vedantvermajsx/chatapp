import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';

export default function emitUserLeftRoom(roomId, data, senderSocketId = null) {
  const io = getIO();
  
  if (io) {
    if (senderSocketId) {
      io.to(roomId).except(senderSocketId).emit('userLeftRoom', data);
    } else {
      io.to(roomId).emit('userLeftRoom', data);
    }
  }
  publish('userLeftRoom', { roomId, data });
}
