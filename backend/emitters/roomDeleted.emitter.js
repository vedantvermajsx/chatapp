import { enqueueEmit } from '../utils/emitQueue.js';

export default function emitRoomDeleted(data) {
  enqueueEmit('roomDeleted', data);
}
