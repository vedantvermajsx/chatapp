import Room from '../models/room.model.js';
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
    this.roomsByUser = new Map();
    this.roomOrder = [];
    this.trie = new RoomTrie();
    this.ready = false;
  }

  async initialize() {
    const rooms = await Room.find({}).sort({ createdAt: -1 }).lean();

    for (const room of rooms) {
      const roomId = String(room._id);

      room.groupMembers = [...new Set((room.groupMembers || []).map(String))];

      this.roomsById.set(roomId, room);
      this.roomOrder.push(roomId);

      if (!room.isDeleted) {
        this.trie.insert(room.groupName, roomId);
      }

      for (const userId of room.groupMembers) {
        if (!this.roomsByUser.has(userId)) {
          this.roomsByUser.set(userId, new Set());
        }
        this.roomsByUser.get(userId).add(roomId);
      }
    }

    this.ready = true;
    console.log(`[RoomCacheService] preloaded ${rooms.length} rooms)`);
  }

  get sortedRoomIds() {
    return this.roomOrder;
  }

  async addRoomToCache(id, room) {
    const roomId = String(id);

    room.groupMembers = [...new Set((room.groupMembers || []).map(String))];

    this.roomsById.set(roomId, room);

    for (const memberId of room.groupMembers) {
      if (!this.roomsByUser.has(memberId)) {
        this.roomsByUser.set(memberId, new Set());
      }
      this.roomsByUser.get(memberId).add(roomId);
    }

    if (!this.roomOrder.includes(roomId)) {
      this.roomOrder.unshift(roomId);
    }

    if (!room.isDeleted) {
      this.trie.insert(room.groupName, roomId);
    }
  }

  async getRoomById(id) {
    id = String(id);

    const room = this.roomsById.get(id);
    if (room) return room;

    return dedupe(`room:id:${id}`, async () => {
      const existing = this.roomsById.get(id);
      if (existing) return existing;

      const fetched = await Room.findById(id).lean();
      if (!fetched) return null;

      await this.addRoomToCache(id, fetched);
      return this.roomsById.get(id);
    });
  }

  async getRoomsByUserId(userId) {
    const rooms = this.roomsByUser.get(String(userId));

    if (!rooms) return [];

    return [...rooms];
  }

  async getUserJoinedRooms(userId) {
    const roomIds = await this.getRoomsByUserId(userId);

    const rooms = [];

    for (const roomId of roomIds) {
      const room = await this.getRoomById(roomId);

      if (!room) continue;

      rooms.push({
        _id: room._id,
        groupName: room.groupName,
        groupDescription: room.groupDescription,
        groupAdmin: room.groupAdmin,
        groupPic: room.groupPic,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        isDeleted: room.isDeleted,
        memberCount: room.groupMembers.length
      });
    }

    rooms.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    return rooms;
  }

  syncMemberIds(roomId, memberIds) {
    const room = this.roomsById.get(String(roomId));

    if (!room) return;

    room.groupMembers = [...memberIds];

    this.roomsById.set(String(roomId), room);
  }

  async refreshRoom(roomId) {
    const id = String(roomId);
    const room = await Room.findById(id).lean();

    if (!room) {
      this.removeRoomFromIndex(id);
      return null;
    }

    room.groupMembers = [...new Set(room.groupMembers.map(String))];

    const old = this.roomsById.get(id);
    if (old && !old.isDeleted && old.groupName !== room.groupName) {
      this.trie.remove(old.groupName, id);
      if (!room.isDeleted) this.trie.insert(room.groupName, id);
    } else if (!old && !room.isDeleted) {
      this.trie.insert(room.groupName, id);
    }

    this.roomsById.set(id, room);

    return room;
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
    this.roomsById.set(id, room);
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

  async getRoomByName(groupName) {
    const cacheKey = `room:name:${groupName}`;
    const cached = roomCache.get(cacheKey);
    if (cached) return cached;

    return dedupe(cacheKey, async () => {
      const room = await Room.findOne({ groupName }).lean();
      if (room) {
        roomCache.set(cacheKey, room, NAME_LOOKUP_TTL_SECONDS);
      }
      return room;
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

  async renameRoom(id, oldName, newName) {
    this.updateRoomNameInIndex(String(id), oldName, newName);
    roomCache.delete(`room:name:${oldName}`);
  }
}

export default new RoomCacheService();

RoomCacheService.prototype.addRoomMember = async function (roomId, userId) {
  const id = String(roomId);
  const uid = String(userId);

  const room = await this.getRoomById(id);
  if (!room) return null;

  if (!room.groupMembers.includes(uid)) {
    room.groupMembers = [...room.groupMembers, uid];
    this.roomsById.set(id, room);
  }

  this.invalidateRoomMembers(id);

  return room;
};

RoomCacheService.prototype.addUserRoom = async function (userId, roomId, roomDoc) {
  const id = String(roomId);
  const uid = String(userId);

  if (!this.roomsByUser.has(uid)) {
    this.roomsByUser.set(uid, new Set());
  }
  this.roomsByUser.get(uid).add(id);

  return {
    _id: roomDoc._id,
    groupName: roomDoc.groupName,
    groupDescription: roomDoc.groupDescription,
    groupAdmin: roomDoc.groupAdmin,
    groupPic: roomDoc.groupPic,
    createdAt: roomDoc.createdAt,
    updatedAt: roomDoc.updatedAt,
    isDeleted: roomDoc.isDeleted,
    memberCount: (roomDoc.groupMembers || []).length,
  };
};

RoomCacheService.prototype.removeRoomMember = async function (roomId, userId) {
  const id = String(roomId);
  const uid = String(userId);

  const room = this.roomsById.get(id);
  if (!room) return null;

  room.groupMembers = (room.groupMembers || []).filter((m) => m !== uid);
  this.roomsById.set(id, room);

  this.invalidateRoomMembers(id);

  if (room.isDeleted && room.groupMembers.length === 0) {
    this.removeRoomFromIndex(id);
    roomCache.delete(`room:name:${room.groupName}`);
  }

  return room;
};

RoomCacheService.prototype.removeUserRoom = async function (userId, roomId) {
  const uid = String(userId);
  const id = String(roomId);

  const userSet = this.roomsByUser.get(uid);
  if (userSet) {
    userSet.delete(id);
    if (userSet.size === 0) {
      this.roomsByUser.delete(uid);
    }
  }
};

RoomCacheService.prototype.markRoomDeleted = async function (id) {
  const room = await this.getRoomById(id);

  if (!room) {
    return { message: 'Room not found' };
  }

  room.isDeleted = true;

  this.markRoomDeletedInIndex(String(id));

  return {
    success: true,
    message: 'Room has been deleted'
  };
};