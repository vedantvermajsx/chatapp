import Room from '../../models/room.model.js';
import emitRoomDeleted from '../../emitters/roomDeleted.emitter.js';
import roomCache from '../../database/roomCache.js';
import { publish } from '../../utils/messageBroker.js';

export async function deleteRoom(req, res) {
  try {
    const room = await roomCache.getRoomById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (room.groupAdmin !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete room' });
    }

    await Room.findByIdAndDelete(req.params.roomId);
    await roomCache.deleteRoomById(req.params.roomId);

    publish('room.deleted', { roomId: req.params.roomId });

    emitRoomDeleted({ roomId: req.params.roomId });

    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
