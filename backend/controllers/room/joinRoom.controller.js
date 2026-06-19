import userCache from '../../database/userCache.js';
import emitUserJoinedRoom from '../../emitters/userJoinedRoom.emitter.js';
import roomCache from '../../database/roomCache.js';

export async function joinRoom(req, res) {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    const room = await roomCache.getRoomById(roomId);
    const user = await userCache.getUserById(userId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.groupMembers.map(String).includes(userId)) {
      const updatedRoom = await roomCache.updateRoomById(roomId, {
        groupMembers: [...room.groupMembers.map(String), userId]
      });
      if (!updatedRoom) {
        return res.status(404).json({ message: 'Room not found' });
      }
      await roomCache.invalidateRoomMembers(roomId);
    }

    console.log('user joined');
    emitUserJoinedRoom(roomId, { username, userId });

    res.json({ message: 'Joined room successfully' });
  } catch (err) {
    console.error('joinRoom error:', err);
    res.status(500).json({ message: err.message });
  }
}