import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';

export default function emitRoomDeleted(data) {
  const io = getIO();
  if (io) {
    io.emit('roomDeleted', data);
  }
  publish('roomDeleted', data);
}
