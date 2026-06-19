import mongoose from 'mongoose';
import Room from '../models/room.model.js';
import User from '../models/user.model.js';
import Guest from '../models/guest.model.js';
import { cache } from '../utils/cacheService.js';

const MEMBERS_PAGE_TTL_SECONDS = 300;

class RoomCache {
  async addRoomToCache(id, data) {
    const resolvedData = await data;
    await cache.set(`room:${id}`, resolvedData, 3600, 'room'); 
  }

  async getRoomById(id) {
    let room = await cache.get(`room:${id}`, 'room');

    if (!room) {
      room = await Room.findById(id);
      if (room) {
        await this.addRoomToCache(id, room);
      }
    }

    return room;
  }

  async getRoomsByUserId(userId) {
    return Room.find({ groupMembers: userId }).select('_id').lean();
  }

  async getRoomMembers(roomId, { skip = 0, limit = 20 } = {}) {
    const cacheKey = `roommembers:${roomId}:${skip}:${limit}`;
    const cached = await cache.get(cacheKey, 'roommembers');
    if (cached) return cached;

    const room = await this.getRoomById(roomId);
    if (!room) return null;

    const memberIds = room.groupMembers.map(String);
    if (memberIds.length === 0) {
      const empty = { members: [], total: 0, hasMore: false };
      await cache.set(cacheKey, empty, MEMBERS_PAGE_TTL_SECONDS, 'roommembers');
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

    await cache.set(cacheKey, page, MEMBERS_PAGE_TTL_SECONDS, 'roommembers');
    return page;
  }

  async invalidateRoomMembers(roomId, { maxMembers = 500, pageSize = 20 } = {}) {
    const deletions = [];
    for (let skip = 0; skip < maxMembers; skip += pageSize) {
      deletions.push(cache.delete(`roommembers:${roomId}:${skip}:${pageSize}`, 'roommembers'));
    }
    await Promise.all(deletions);
  }

  async getAllRooms() {
    const rooms = await Room.find().sort({ createdAt: -1 });
    return rooms;
  }

  async updateRoomById(id, data) {
    let room = await Room.findByIdAndUpdate(id, data, { new: true });
    if (room) {
      await this.addRoomToCache(id, room);
    }
    return room;
  }

  async deleteRoomById(id) {
    await cache.delete(`room:${id}`, 'room');
    await Room.findByIdAndDelete(id);
  }
}

export default new RoomCache();