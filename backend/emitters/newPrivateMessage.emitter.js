import { enqueueEmit } from '../utils/emitQueue.js';

export default function emitNewPrivateMessage(senderId, receiverId, payload) {
  enqueueEmit('newPrivateMessage', { senderId, receiverId, payload });
}
