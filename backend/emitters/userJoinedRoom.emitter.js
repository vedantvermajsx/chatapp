import { enqueueEmit } from '../utils/emitQueue.js';

export default function emitUserJoinedRoom(roomId, eventData, senderSocketId = null) {
  enqueueEmit('userJoinedRoom', { roomId, eventData, senderSocketId });
}
