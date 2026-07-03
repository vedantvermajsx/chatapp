import mongoose from 'mongoose';
import Room from '../models/room.model.js';
import UserRoom from '../models/userRoom.model.js';
import { roomCache } from './CacheService.js';
import UserCacheService from './UserCacheService.js';
import RoomTrie from './RoomTrie.js';

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

const inFlight = new Map();

async function dedupe(key, fetcher) {
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = fetcher().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

class RoomCacheService {
  constructor() {
    this.roomsById = new Map();
    this.roomOrder = [];          
    this.trie = new RoomTrie();
    this.ready = false;
  }

  async initialize() {
    const rooms = await Room.find({}).sort({ createdAt: -1 }).lean();

    for (const room of rooms) {
      const id = room._id.toString();
      this.roomsById.set(id, room);
      this.roomOrder.push(id);
      if (!room.isDeleted) {
        this.trie.insert(room.groupName, id);
      }
    }
    this.ready = true;
    console.log(`[RoomCacheService] preloaded ${rooms.length} rooms)`);
  }

  get sortedRoomIds() {
    return this.roomOrder;
  }

  addRoomToIndex(room) {
    const id = room._id.toString();
    const isNew = !this.roomsById.has(id);
    this.roomsById.set(id, room);
    if (isNew) this.roomOrder.unshift(id);
    if (!room.isDeleted) {
      this.trie.insert(room.groupName, id);
    }
  }

  removeRoomFromIndex(id) {
    const room = this.roomsById.get(id);
    if (!room) return;
    this.trie.remove(room.groupName, id);
    this.roomsById.delete(id);
    this.roomOrder = this.roomOrder.filter(rid => rid !== id);
  }

  markRoomDeletedInIndex(id) {
    const room = this.roomsById.get(id);
    if (!room) return;
    this.trie.remove(room.groupName, id);
    room.isDeleted = true;
    this.roomsById.set(id, room);
    this.roomOrder = this.roomOrder.filter(rid => rid !== id);
  }

  updateRoomNameInIndex(id, oldName, newName) {
    const room = this.roomsById.get(id);
    if (!room) return;
    if (!room.isDeleted) {
      this.trie.remove(oldName, id);
      this.trie.insert(newName, id);
    }
    room.groupName = newName;
    this.roomsById.set(id,room);
  }

  syncMemberIdsInIndex(roomId, memberIds) {
    const room = this.roomsById.get(roomId);
    if (!room) return;
    room.groupMembers = memberIds;
    this.roomsById.set(roomId, room);
  }

  async addRoomToCache(id, data) {
    data.isDeleted = false;
    data.groupMembers = [...new Set((data.groupMembers || []).map(String))];
    roomCache.set(`room:${id}`, data, null);
    this.addRoomToIndex(data);
  }

  async getRoomById(id) {
    const fromIndex = this.roomsById.get(String(id));
    if (fromIndex) return fromIndex;

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

  async isValidRoomId(id) {
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
      this.removeRoomFromIndex(String(roomId));
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

  getAllRooms({ search = '', skip = 0, limit = 20 } = {}) {
    let ids;

    if (search) {
      ids = [...this.trie.search(search)];
      const order = new Map(this.sortedRoomIds.map((id, i) => [id, i]));
      ids.sort((a, b) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity));
    } else {
      ids = this.sortedRoomIds;
    }

    const rooms = ids
      .map(id => this.roomsById.get(id))
      .filter(room => room && !room.isDeleted);

    const total = rooms.length;
    const page = rooms.slice(skip, skip + limit).map(r => ({
      _id: r._id,
      groupName: r.groupName,
      groupDescription: r.groupDescription,
      groupAdmin: r.groupAdmin,
      groupPic: r.groupPic,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      memberCount: (r.groupMembers || []).length,
    }));

    return { rooms: page, total };
  }

  async deleteRoomCache(id) {
    roomCache.delete(`room:${id}`);
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
      this.syncMemberIdsInIndex(String(roomId), ids);

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
    this.syncMemberIdsInIndex(String(roomId), filtered);

    await this.invalidateRoomMembers(roomId);
  }

  async setRoomMemberIds(roomId, memberIds) {
    const ids = memberIds.map(String);
    roomCache.set(this._memberIdsKey(roomId), ids, null);
    this.syncMemberIdsInIndex(String(roomId), ids);
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

  async renameRoom(id, oldName, newName) {
    this.updateRoomNameInIndex(String(id), oldName, newName);
    const cached = roomCache.get(`room:${id}`);
    if (cached) {
      cached.groupName = newName;
      roomCache.set(`room:${id}`, cached, null);
    }
    roomCache.delete(`room:name:${oldName}`);
  }
}

export default new RoomCacheService();

RoomCacheService.prototype.markRoomDeleted = async function (id) {
  let room = roomCache.get(`room:${id}`);
  if (!room) {
    room = await Room.findById(id).lean();
    if (!room) return { message: 'Room not found' };
  }
  roomCache.set(`room:${id}`, { ...room, isDeleted: true }, null);
  this.markRoomDeletedInIndex(String(id));

  const memberIds = (room.groupMembers || []).map(String);
  for (const memberId of memberIds) {
    this.invalidateUserRooms(memberId);
  }

  return { success: true, message: 'Room has been deleted' };
};