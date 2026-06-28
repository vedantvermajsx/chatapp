import { enqueueEmit } from '../utils/emitQueue.js';

export default function emitUserLeftRoom(roomId, eventData, senderSocketId = null) {
  enqueueEmit('userLeftRoom', { roomId, eventData, senderSocketId });
}
