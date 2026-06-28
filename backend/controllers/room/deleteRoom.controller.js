import emitRoomDeleted from '../../emitters/roomDeleted.emitter.js';
import roomCacheClient from '../../database/roomCacheClient.js';
import { enqueueRoomDeletion } from '../../utils/queueClient.js';

export async function deleteRoom(req, res) {
  try {
    const { roomId } = req.params;

    const room = await roomCacheClient.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (room.groupAdmin !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete room' });
    }

    await roomCacheClient.markRoomDeleted(roomId);

    res.json({ message: 'Room deleted' });

    emitRoomDeleted({ roomId });
    enqueueRoomDeletion(roomId);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
