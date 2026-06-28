import { enqueueEmit } from '../utils/emitQueue.js';

export default function emitNewMessage(roomId, payload, senderSocketId = null) {
  enqueueEmit('newMessage', { roomId, payload, senderSocketId });
}
