import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';

export default function emitUserJoinedRoom(roomId, data, senderSocketId = null) {
  const io = getIO();
  if (io) {
    // Exclude the sender's own socket so they don't receive the event themselves
    if (senderSocketId) {
      io.to(roomId).except(senderSocketId).emit('userJoinedRoom', data);
    } else {
      io.to(roomId).emit('userJoinedRoom', data);
    }
  }
  publish('userJoinedRoom', { roomId, data });
}
