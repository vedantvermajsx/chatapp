import mongoose from 'mongoose';
import Room from '../models/room.model.js';
import User from '../models/user.model.js';
import Guest from '../models/guest.model.js';
import UserRoom from '../models/userRoom.model.js';
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
    return Room.findOne({ groupName });
  }

  async getRoomsByUserId(userId) {
    return Room.find({ groupMembers: userId }).select('_id').lean();
  }

  async getRoomMembers(roomId, { skip = 0, limit = 20, search = '' } = {}) {
    const cacheKey = search 
      ? `roommembers:${roomId}:${skip}:${limit}:${search}` 
      : `roommembers:${roomId}:${skip}:${limit}`;
    const cached = roomCache.get(cacheKey);
    if (cached) return cached;

    const room = await this.getRoomById(roomId);
    if (!room) return null;

    const memberIds = (room.groupMembers || []).map(String);
    if (memberIds.length === 0) {
      const empty = { members: [], total: 0, hasMore: false };
      roomCache.set(cacheKey, empty, MEMBERS_PAGE_TTL_SECONDS);
      return empty;
    }

    // User _ids are stored as strings; Guest _ids are also strings (guest_xxx).
    // Split into regular users (non-guest) and guests by prefix.
    const regularIds = memberIds.filter(id => !id.startsWith('guest_'));
    const guestIds   = memberIds.filter(id =>  id.startsWith('guest_'));

    const guestCollectionName = Guest.collection.name;

    const pipeline = [
      
      { $match: { _id: { $in: regularIds } } },
      {
        $unionWith: {
          coll: guestCollectionName,
          pipeline: [{ $match: { _id: { $in: guestIds } } }]
        }
      },
      ...(search ? [{ $match: { username: { $regex: search, $options: 'i' } } }] : []),
      { $sort: { username: 1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
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

  async getAllRooms({ search = '', skip = 0, limit = 20 } = {}) {
    const matchStage = search
      ? { groupName: { $regex: search, $options: 'i' } }
      : {};

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
    return { rooms, total };
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

    
    const room = await this.getRoomById(roomId);
    if (!room) return null;

    const ids = (room.groupMembers || []).map(String);
    roomCache.set(key, ids, 3600);
    return ids;
  }

  async addRoomMember(roomId, userId) {
    const key = this._memberIdsKey(roomId);
    const ids = await this.getRoomMemberIds(roomId);
    if (!ids) return;

    const userStr = String(userId);
    if (!ids.includes(userStr)) {
      ids.push(userStr);
      roomCache.set(key, ids, 3600);

      const room = roomCache.get(`room:${roomId}`);
      if (room) {
        room.groupMembers = ids;
        roomCache.set(`room:${roomId}`, room, 3600);
      }

      await this.invalidateRoomMembers(roomId);
    }
  }

  async removeRoomMember(roomId, userId) {
    const key = this._memberIdsKey(roomId);
    const ids = await this.getRoomMemberIds(roomId);
    if (!ids) return;

    const filtered = ids.filter(id => id !== String(userId));
    roomCache.set(key, filtered, 3600);

    const room = roomCache.get(`room:${roomId}`);
    if (room) {
      room.groupMembers = filtered;
      roomCache.set(`room:${roomId}`, room, 3600);
    }

    await this.invalidateRoomMembers(roomId);
  }

  async setRoomMemberIds(roomId, memberIds) {
    roomCache.set(this._memberIdsKey(roomId), memberIds.map(String), 3600);
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
      memberCount: Array.isArray(room.groupMembers) ? room.groupMembers.length : (room.memberCount ?? 0),
    };
  }

  async getUserJoinedRooms(userId) {
    const key = this._userRoomsKey(userId);
    const cached = roomCache.get(key);
    if (cached) return cached;

    
    const userRoom = await UserRoom.findOne({ userId }).lean();
    const roomIds = userRoom?.roomIds ?? [];
    if (roomIds.length === 0) {
      roomCache.set(key, [], 3600);
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
          memberCount: { $size: { $ifNull: ['$groupMembers', []] } }
        }
      }
    ]);

    roomCache.set(key, rooms, 3600);
    return rooms;
  }

  async addUserRoom(userId, roomId, roomData) {
    const key = this._userRoomsKey(userId);
    let rooms = roomCache.get(key);

    
    const formatted = this._formatRoom(roomData);

    if (!rooms) {
      
      roomCache.set(key, [formatted], 3600);
      return formatted;
    }

    
    const exists = rooms.some(r => r._id?.toString() === formatted._id?.toString());
    if (!exists) {
      rooms = [formatted, ...rooms];
      roomCache.set(key, rooms, 3600);
    }
    return formatted;
  }

  async removeUserRoom(userId, roomId) {
    const key = this._userRoomsKey(userId);
    const rooms = roomCache.get(key);
    if (!rooms) return;
    const filtered = rooms.filter(r => r._id?.toString() !== String(roomId));
    roomCache.set(key, filtered, 3600);
  }

  invalidateUserRooms(userId) {
    roomCache.delete(this._userRoomsKey(userId));
  }
}

export default new RoomCacheService();



RoomCacheService.prototype.markRoomDeleted = async function(id) {
  let room = roomCache.get(`room:${id}`);
  if (!room) {
    room = await Room.findById(id).lean();
    if (!room) return;
  }
  roomCache.set(`room:${id}`, { ...room, isDeleted: true }, 3600);
};
