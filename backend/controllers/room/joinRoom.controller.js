import Room from '../../models/room.model.js';
import emitUserJoinedRoom from '../../emitters/userJoinedRoom.emitter.js';
import roomCacheClient from '../../database/roomCacheClient.js';

export async function joinRoom(req, res) {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    const validCheck = await roomCacheClient.isValidRoomId(roomId);
    if (!validCheck || !validCheck.isValid) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const hasMember = await roomCacheClient.hasMember(roomId, userId);

    if (!hasMember) {
      const result = await Room.updateOne(
        { _id: roomId },
        { $addToSet: { groupMembers: userId } }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      await roomCacheClient.refreshRoomCache(roomId);
      emitUserJoinedRoom(roomId, { username, userId });
      return res.json({ message: 'Joined room successfully' });
    }

    return res.json({ alreadyMember: true });
  } catch (err) {
    console.error('joinRoom error:', err);
    res.status(500).json({ message: err.message });
  }
}