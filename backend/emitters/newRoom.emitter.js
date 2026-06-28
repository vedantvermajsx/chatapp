import { enqueueEmit } from '../utils/emitQueue.js';

export default function emitNewRoom(room) {
  enqueueEmit('newRoom', room);
}
