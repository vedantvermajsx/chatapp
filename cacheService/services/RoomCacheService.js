import mongoose from 'mongoose';
import Room from '../models/room.model.js';
import UserRoom from '../models/userRoom.model.js';
import { roomCache } from './CacheService.js';
import { invalidateRoomMessages } from './MessageCacheService.js';
import UserCacheService from './UserCacheService.js';

const MEMBER_PROJECTION = ({ _id, username, gender, isOnline, avatar }) => ({
  _id,
  username,
  gender,
  isOnline,
  avatar: avatar ?? '',
});

async function resolveMembers(ids) {
  const usersById = await UserCacheService.getUsersByIds(ids);
  const results = ids.map((id) => {
    const user = usersById.get(String(id));
    return user ? MEMBER_PROJECTION(user) : null;
  });
  return results.filter(Boolean);
}

const MEMBERS_PAGE_TTL_SECONDS = null;
const NAME_LOOKUP_TTL_SECONDS = null;
const USER_ROOMLIST_TTL_SECONDS = null;
const ALL_ROOMS_TTL_SECONDS = 300;

const inFlight = new Map();

async function dedupe(key, fetcher) {
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = fetcher().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

class RoomCacheService {
  async addRoomToCache(id, data) {
    data.isDeleted=false;
    data.groupMembers=[...new Set((data.groupMembers || []).map(String))];
    roomCache.set(`room:${id}`, data, null); 
  }

  async getRoomById(id) {
    const cacheKey = `room:${id}`;
    const cached = roomCache.get(cacheKey);
    if (cached) return cached;

    return dedupe(cacheKey, async () => {
      const room = await Room.findById(id);
      if (room) {
        await this.addRoomToCache(id, room);
      }
      return room;
    });
  }

  async isValidRoomId(id){
    const room = await this.getRoomById(id);
    if (room && !room.isDeleted) {
      return { isValid: true, id };
    }
    return { isValid: false, id: null };
  }

  async hasMember(roomId, userId) {
    const room = await this.getRoomById(roomId);
    if (!room || !room.groupMembers) return false;
    return room.groupMembers.includes(userId);
  }

  async getRoomAdmin(roomId) {
    const room = await this.getRoomById(roomId);
    return room ? room.groupAdmin : null;
  }

  async refreshRoom(roomId) {
    const room = await Room.findById(roomId);
    if (room) {
      await this.addRoomToCache(roomId, room);
    } else {
      roomCache.delete(`room:${roomId}`);
    }
    await this.invalidateRoomMembers(roomId);
    return room;
  }

  async getRoomByName(groupName) {
    const cacheKey = `room:name:${groupName}`;
    const cached = roomCache.get(cacheKey);
    if (cached) return cached;

    return dedupe(cacheKey, async () => {
      const room = await Room.findOne({ groupName });
      if (room) {
        roomCache.set(cacheKey, room, NAME_LOOKUP_TTL_SECONDS);
      }
      return room;
    });
  }

  async getRoomsByUserId(userId) {
    const cacheKey = `roomsByUser:${userId}`;
    const cached = roomCache.get(cacheKey);
    if (cached) return cached;

    return dedupe(cacheKey, async () => {
      const rooms = await Room.find({ groupMembers: userId }).select('_id').lean();
      roomCache.set(cacheKey, rooms, USER_ROOMLIST_TTL_SECONDS);
      return rooms;
    });
  }

  async getRoomMembers(roomId, { skip = 0, limit = 20, search = '' } = {}) {
    const cacheKey = search 
      ? `roommembers:${roomId}:${skip}:${limit}:${search}` 
      : `roommembers:${roomId}:${skip}:${limit}`;
    const cached = roomCache.get(cacheKey);
    if (cached) return cached;

    return dedupe(cacheKey, async () => {
      const room = await this.getRoomById(roomId);
      if (!room) return null;

      const memberIds = (room.groupMembers || []).map(String);
      if (memberIds.length === 0) {
        const empty = { members: [], total: 0, hasMore: false };
        roomCache.set(cacheKey, empty, MEMBERS_PAGE_TTL_SECONDS);
        return empty;
      }

      let page;

      if (!search) {
        const pageIds = memberIds.slice(skip, skip + limit);
        const members = await resolveMembers(pageIds);

        page = {
          members,
          total: memberIds.length,
          hasMore: skip + limit < memberIds.length,
        };
      } else {
        const allMembers = await resolveMembers(memberIds);

        const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const matched = allMembers.filter(d => re.test(d.username || ''));

        const total = matched.length;
        const members = matched.slice(skip, skip + limit);

        page = {
          members,
          total,
          hasMore: skip + members.length < total
        };
      }

      roomCache.set(cacheKey, page, MEMBERS_PAGE_TTL_SECONDS);
      return page;
    });
  }

  async invalidateRoomMembers(roomId, { maxMembers = 500, pageSize = 20 } = {}) {
    for (let skip = 0; skip < maxMembers; skip += pageSize) {
      roomCache.delete(`roommembers:${roomId}:${skip}:${pageSize}`);
    }
  }

  async getAllRooms({ search = '', skip = 0, limit = 20 } = {}) {
    const cacheKey = `allRooms:${skip}:${limit}:${search}`;
    const cached = roomCache.get(cacheKey);
    if (cached) return cached;

    return dedupe(cacheKey, async () => {
      const matchStage = search
        ? { groupName: { $regex: search, $options: 'i' }, isDeleted: { $ne: true } }
        : { isDeleted: { $ne: true } };

      const [result] = await Room.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  groupName: 1,
                  groupDescription: 1,
                  groupAdmin: 1,
                  groupPic: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  memberCount: { $size: { $ifNull: ['$groupMembers', []] } }
                }
              }
            ],
            totalCount: [{ $count: 'count' }]
          }
        }
      ]);

      const rooms = result?.data ?? [];
      const total = result?.totalCount?.[0]?.count ?? 0;
      const page = { rooms, total };

      roomCache.set(cacheKey, page, ALL_ROOMS_TTL_SECONDS);
      return page;
    });
  }

  async deleteRoomCache(id) {
    roomCache.delete(`room:${id}`);
    roomCache.delete(`roomMemberIds:${id}`);
    await this.invalidateRoomMembers(id);
    invalidateRoomMessages(id);
  }

  
  
  

  _memberIdsKey(roomId) {
    return `roomMemberIds:${roomId}`;
  }

  async getRoomMemberIds(roomId) {
    const key = this._memberIdsKey(roomId);
    const cached = roomCache.get(key);
    if (cached) return cached;

    return dedupe(key, async () => {
      const room = await this.getRoomById(roomId);
      if (!room) return null;

      const ids = (room.groupMembers || []).map(String);
      roomCache.set(key, ids, null);
      return ids;
    });
  }

  async addRoomMember(roomId, userId) {
    const key = this._memberIdsKey(roomId);
    const ids = await this.getRoomMemberIds(roomId);
    if (!ids) return;

    const userStr = String(userId);
    if (!ids.includes(userStr)) {
      ids.push(userStr);
      roomCache.set(key, ids, null);

      const room = roomCache.get(`room:${roomId}`);
      if (room) {
        room.groupMembers = ids;
        roomCache.set(`room:${roomId}`, room, null);
      }

      await this.invalidateRoomMembers(roomId);
    }
  }

  async removeRoomMember(roomId, userId) {
    const key = this._memberIdsKey(roomId);
    const ids = await this.getRoomMemberIds(roomId);
    if (!ids) return;

    const filtered = ids.filter(id => id !== String(userId));
    roomCache.set(key, filtered, null);

    const room = roomCache.get(`room:${roomId}`);
    if (room) {
      room.groupMembers = filtered;
      roomCache.set(`room:${roomId}`, room, null);
    }

    await this.invalidateRoomMembers(roomId);
  }

  async setRoomMemberIds(roomId, memberIds) {
    roomCache.set(this._memberIdsKey(roomId), memberIds.map(String), null);
  }

  
  
  

  _userRoomsKey(userId) {
    return `userRooms:${userId}`;
  }

  _formatRoom(room) {
    return {
      _id: room._id?.toString?.() ?? room._id,
      groupName: room.groupName,
      groupDescription: room.groupDescription,
      groupAdmin: room.groupAdmin,
      groupPic: room.groupPic,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      isDeleted: !!room.isDeleted,
      memberCount: Array.isArray(room.groupMembers) ? room.groupMembers.length : (room.memberCount ?? 0),
    };
  }

  async getUserJoinedRooms(userId) {
    const key = this._userRoomsKey(userId);
    const cached = roomCache.get(key);
    if (cached) return cached;

    return dedupe(key, async () => {
      const userRoom = await UserRoom.findOne({ userId }).lean();
      const roomIds = userRoom?.roomIds ?? [];
      if (roomIds.length === 0) {
        roomCache.set(key, [], null);
        return [];
      }

      const objectIds = roomIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

      const rooms = await Room.aggregate([
        { $match: { _id: { $in: objectIds } } },
        { $sort: { updatedAt: -1 } },
        {
          $project: {
            _id: 1, groupName: 1, groupDescription: 1,
            groupAdmin: 1, groupPic: 1, createdAt: 1, updatedAt: 1,
            isDeleted: 1,
            memberCount: { $size: { $ifNull: ['$groupMembers', []] } }
          }
        }
      ]);

      roomCache.set(key, rooms, null);
      return rooms;
    });
  }

  async addUserRoom(userId, roomId, roomData) {
    const key = this._userRoomsKey(userId);
    let rooms = roomCache.get(key);

    const formatted = this._formatRoom(roomData);

    if (!rooms) {
      rooms = await this.getUserJoinedRooms(userId);
    }

    const exists = rooms.some(r => r._id?.toString() === formatted._id?.toString());
    if (!exists) {
      rooms = [formatted, ...rooms];
      roomCache.set(key, rooms, null);
    }
    return formatted;
  }

  async removeUserRoom(userId, roomId) {
    const key = this._userRoomsKey(userId);
    let rooms = roomCache.get(key);
    if (!rooms) {
      rooms = await this.getUserJoinedRooms(userId);
    }
    const filtered = rooms.filter(r => r._id?.toString() !== String(roomId));
    roomCache.set(key, filtered, null);
  }

  invalidateUserRooms(userId) {
    roomCache.delete(this._userRoomsKey(userId));
    roomCache.delete(`roomsByUser:${userId}`);
  }
}

export default new RoomCacheService();



RoomCacheService.prototype.markRoomDeleted = async function(id) {
  let room = roomCache.get(`room:${id}`);
  if (!room) {
    room = await Room.findById(id).lean();
    if (!room) return;
  }
  roomCache.set(`room:${id}`, { ...room, isDeleted: true }, null);
};