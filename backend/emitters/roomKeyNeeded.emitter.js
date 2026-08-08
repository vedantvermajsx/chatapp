import { enqueueEmit } from '../utils/emitQueue.js';

export default function emitRoomKeyNeeded(roomId, memberIds, payload, excludeUserId = null) {
  memberIds
    .filter((id) => String(id) !== String(excludeUserId))
    .forEach((id) => {
      enqueueEmit('roomKeyNeeded', { to: String(id), payload: { roomId, ...payload } });
    });
}
