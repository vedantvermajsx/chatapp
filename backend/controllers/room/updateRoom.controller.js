import Room from '../../models/room.model.js';
import emitRoomUpdated from '../../emitters/roomUpdated.emitter.js';
import roomCacheClient from '../../database/roomCacheClient.js';

export async function updateRoom(req, res) {
  try {
    const { roomId } = req.params;
    const { groupName, groupDescription, groupPic } = req.body;
    
    const validCheck = await roomCacheClient.isValidRoomId(roomId);
    if (!validCheck || !validCheck.isValid) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const groupAdmin = await roomCacheClient.getRoomAdmin(roomId);
    
    if (groupAdmin !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update room' });
    }
    
    const updates = {};
    
    if (groupName) {
      const exists = await roomCacheClient.getRoomByName(groupName);
      if (exists && String(exists._id) !== roomId) {
        return res.status(409).json({ message: 'Room name already taken' });
      }
      updates.groupName = groupName;
    }
    
    if (groupDescription !== undefined) updates.groupDescription = groupDescription;
    if (groupPic !== undefined) {
      const isCloudinaryUrl = typeof groupPic === 'string' &&
        /^https:\/\/res\.cloudinary\.com\//.test(groupPic);
      if (groupPic && !isCloudinaryUrl) {
        return res.status(400).json({ message: 'Invalid image URL' });
      }
      updates.groupPic = groupPic;
    }
    
    const updatedRoom = await Room.findByIdAndUpdate(roomId, updates, { new: true }).select('-groupMembers');
    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    await roomCacheClient.refreshRoomCache(roomId);
    
    emitRoomUpdated(updatedRoom);
    
    res.json({ message: 'Room updated successfully', room: updatedRoom });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}