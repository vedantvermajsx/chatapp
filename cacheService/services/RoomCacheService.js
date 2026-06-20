import mongoose from 'mongoose';
import Room from '../models/room.model.js';
import User from '../models/user.model.js';
import Guest from '../models/guest.model.js';
import { roomCache } from './CacheService.js';
import { invalidateRoomMessages } from './MessageCacheService.js';

const MEMBERS_PAGE_TTL_SECONDS = 300;

class RoomCacheService {
  async addRoomToCache(id, data) {
    const resolvedData = await data;
    roomCache.set(`room:${id}`, resolvedData, 3600); 
  }

  async getRoomById(id) {
    let room = roomCache.get(`room:${id}`);

    if (!room) {
      room = await Room.findById(id);
      if (room) {
        await this.addRoomToCache(id, room);
      }
    }

    return room;
  }

  async getRoomByName(groupName) {
    return Room.findOne({ groupName });
  }

  async getRoomsByUserId(userId) {
    return Room.find({ groupMembers: userId }).select('_id').lean();
  }

  async getRoomMembers(roomId, { skip = 0, limit = 20 } = {}) {
    const cacheKey = `roommembers:${roomId}:${skip}:${limit}`;
    const cached = roomCache.get(cacheKey);
    if (cached) return cached;

    const room = await this.getRoomById(roomId);
    if (!room) return null;

    const memberIds = room.groupMembers.map(String);
    if (memberIds.length === 0) {
      const empty = { members: [], total: 0, hasMore: false };
      roomCache.set(cacheKey, empty, MEMBERS_PAGE_TTL_SECONDS);
      return empty;
    }

    const userObjectIds = memberIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const guestCollectionName = Guest.collection.name;

    const pipeline = [
      { $match: { _id: { $in: userObjectIds } } },
      {
        $unionWith: {
          coll: guestCollectionName,
          pipeline: [{ $match: { _id: { $in: memberIds } } }]
        }
      },
      { $sort: { username: 1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                id: '$_id',
                username: 1,
                gender: 1,
                isOnline: 1,
                role: { $ifNull: ['$role', 'guest'] },
                avatar: { $ifNull: ['$avatar', ''] },
                bio: { $ifNull: ['$bio', ''] }
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const [result] = await User.aggregate(pipeline);
    const members = result?.data || [];
    const total = result?.totalCount?.[0]?.count || 0;

    const page = {
      members,
      total,
      hasMore: skip + members.length < total
    };

    roomCache.set(cacheKey, page, MEMBERS_PAGE_TTL_SECONDS);
    return page;
  }

  async invalidateRoomMembers(roomId, { maxMembers = 500, pageSize = 20 } = {}) {
    for (let skip = 0; skip < maxMembers; skip += pageSize) {
      roomCache.delete(`roommembers:${roomId}:${skip}:${pageSize}`);
    }
  }

  async getAllRooms({ search = '' } = {}) {
    const query = search
      ? { groupName: { $regex: search, $options: 'i' } }
      : {};
    const rooms = await Room.find(query).sort({ createdAt: -1 });
    return rooms;
  }

  async deleteRoomCache(id) {
    // 1. Delete room cache
    roomCache.delete(`room:${id}`);
    
    // 2. Invalidate room members cache
    await this.invalidateRoomMembers(id);

    // 3. Invalidate room messages cache
    invalidateRoomMessages(id);
  }
}

export default new RoomCacheService();
