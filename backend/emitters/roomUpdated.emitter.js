import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';

export default function emitRoomUpdated(room) {
  const io = getIO();
  if (io) {
    io.emit('roomUpdated', room);
  }
  publish('roomUpdated', room);
}
