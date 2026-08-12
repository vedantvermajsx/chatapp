import roomCacheService from '../../services/RoomCacheService.js';
import UserRoom from '../../models/userRoom.model.js';
import { readStateCache } from '../../services/CacheService.js';

export const addRoomMember = async (req, res) => {
  try {
    const { userId, memberData } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const roomId = req.params.id;
    await roomCacheService.addRoomMember(roomId, userId, memberData || null);

    
    const roomDoc = await roomCacheService.getRoomById(roomId);
    const roomData = roomDoc ? await roomCacheService.addUserRoom(userId, roomId, roomDoc) : null;

    await UserRoom.findOneAndUpdate(
      { userId },
      { $addToSet: { roomIds: roomId } },
      { upsert: true }
    );
    readStateCache.delete(`userRooms:${userId}`);

    res.json({ ok: true, room: roomData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};