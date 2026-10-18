import Room from '../../models/room.model.js';
import UserRoom from '../../models/userRoom.model.js';
import { readStateCache } from '../../services/CacheService.js';

export async function getUserRoomIds(userId) {
  const cacheKey = `userRooms:${userId}`;
  const cached = readStateCache.get(cacheKey);
  if (cached) return cached;

  let userRoom = await UserRoom.findOne({ userId }).lean();
  let roomIds = userRoom?.roomIds?.map(String) ?? null;

  if (!roomIds) {
    const rooms = await Room.find({ groupMembers: userId }, '_id').lean();
    roomIds = rooms.map(r => String(r._id));
    if (roomIds.length > 0) {
      await UserRoom.findOneAndUpdate(
        { userId },
        { $set: { roomIds } },
        { upsert: true }
      );
    }
  }

  const result = roomIds ?? [];
  readStateCache.set(cacheKey, result, 6000);
  return result;
}
