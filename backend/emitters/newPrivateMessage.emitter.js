import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';

export default function emitNewPrivateMessage(senderId, receiverId, payload) {
  const io = getIO();
  if (io) {
    io.to(receiverId).emit('newPrivateMessage', payload);
    io.to(senderId).emit('newPrivateMessage', payload);
  }
  publish('newPrivateMessage', { senderId, receiverId, payload });
}
