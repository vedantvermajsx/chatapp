import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';

export default function emitNewMessage(roomId, payload) {
  const io = getIO();
  if (io) {
    io.to(roomId).emit('newMessage', payload);
  }
  
  publish('newMessage', { roomId, payload });
}
