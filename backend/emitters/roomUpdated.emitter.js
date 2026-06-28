import { enqueueEmit } from '../utils/emitQueue.js';

export default function emitRoomUpdated(room) {
  enqueueEmit('roomUpdated', room);
}
