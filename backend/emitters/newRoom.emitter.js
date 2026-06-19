import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';

export default function emitNewRoom(room) {
  const io = getIO();
  if (io) {
    io.emit('newRoom', room);
  }
  publish('newRoom', room);
}
