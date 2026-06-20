import Room from '../../models/room.model.js';
import emitUserJoinedRoom from '../../emitters/userJoinedRoom.emitter.js';
import roomCacheClient from '../../database/roomCacheClient.js';
import userCacheClient from '../../database/userCacheClient.js';

export async function joinRoom(req, res) {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    const room = await roomCacheClient.getRoomById(roomId);
    const user = await userCacheClient.getUserById(userId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.groupMembers.map(String).includes(userId)) {
      const updatedRoom = await Room.findByIdAndUpdate(roomId, {
        groupMembers: [...room.groupMembers.map(String), userId]
      }, { new: true });
      if (!updatedRoom) {
        return res.status(404).json({ message: 'Room not found' });
      }
      await roomCacheClient.addRoomToCache(roomId, updatedRoom);
      await roomCacheClient.invalidateRoomMembers(roomId);
    }

    console.log('user joined');
    emitUserJoinedRoom(roomId, { username, userId });

    res.json({ message: 'Joined room successfully' });
  } catch (err) {
    console.error('joinRoom error:', err);
    res.status(500).json({ message: err.message });
  }
}