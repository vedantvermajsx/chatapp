import Room from '../../models/room.model.js';
import emitUserLeftRoom from '../../emitters/userLeftRoom.emitter.js';
import roomCacheClient from '../../database/roomCacheClient.js';

export async function leaveRoom(req, res) {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    const validCheck = await roomCacheClient.isValidRoomId(roomId);
    if (!validCheck || !validCheck.isValid) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const hasMember = await roomCacheClient.hasMember(roomId, userId);

    if (hasMember) {
      const result = await Room.updateOne(
        { _id: roomId },
        { $pull: { groupMembers: userId } }
      );
      
      if (result.matchedCount > 0) {
        await roomCacheClient.refreshRoomCache(roomId);
      }
    }

    console.log('user left room:', username);
    emitUserLeftRoom(roomId, { username, userId });

    res.json({ message: 'Left room successfully' });
  } catch (err) {
    console.error('leaveRoom error:', err);
    res.status(500).json({ message: err.message });
  }
}
