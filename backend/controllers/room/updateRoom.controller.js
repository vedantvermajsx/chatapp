import Room from '../../models/room.model.js';
import emitRoomUpdated from '../../emitters/roomUpdated.emitter.js';
import roomCache from '../../database/roomCache.js';

export async function updateRoom(req, res) {
  try {
    const { roomId } = req.params;
    const { groupName, groupDescription, groupPic } = req.body;
    
    const room = await roomCache.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (room.groupAdmin !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update room' });
    }
    
    const updates = {};
    
    if (groupName && groupName !== room.groupName) {
      const exists = await Room.findOne({ groupName });
      if (exists) {
        return res.status(409).json({ message: 'Room name already taken' });
      }
      updates.groupName = groupName;
    }
    
    if (groupDescription !== undefined) updates.groupDescription = groupDescription;
    if (groupPic !== undefined) updates.groupPic = groupPic;
    
    const updatedRoom = await roomCache.updateRoomById(roomId, updates);
    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    emitRoomUpdated(updatedRoom);
    
    res.json({ message: 'Room updated successfully', room: updatedRoom });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
