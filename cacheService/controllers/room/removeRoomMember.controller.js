import roomCacheService from '../../services/RoomCacheService.js';
import UserRoom from '../../models/userRoom.model.js';
import { readStateCache } from '../../services/CacheService.js';

export const removeRoomMember = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const roomId = req.params.id;
    await roomCacheService.removeRoomMember(roomId, userId);

    await roomCacheService.removeUserRoom(userId, roomId);

    await UserRoom.findOneAndUpdate(
      { userId },
      { $pull: { roomIds: roomId } }
    );
    readStateCache.delete(`userRooms:${userId}`);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
