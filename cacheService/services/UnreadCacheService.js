import { messageCache } from './CacheService.js';
import MessageCountCacheService from './MessageCountCacheService.js';
import RoomMessageRead from '../models/roomMessageRead.model.js';

const TTL = null;

function privKey(userId) {
  return `unread:${userId}`;
}

function readKey(userId) {
  return `readCount:${userId}`;
}

function isRoomKey(chatKey) {
  return typeof chatKey === 'string' && chatKey.startsWith('room_');
}

function roomIdOf(chatKey) {
  return chatKey.slice('room_'.length);
}

async function getRoomReadCount(userId, roomId) {
  const all = messageCache.get(readKey(userId)) ?? {};
  if (Object.prototype.hasOwnProperty.call(all, roomId)) return all[roomId];

  const doc = await RoomMessageRead.findOne({ userId, roomId }).lean();
  const count = doc?.readCount ?? 0;
  all[roomId] = count;
  messageCache.set(readKey(userId), all, TTL);
  return count;
}

function persistRoomReadCount(userId, roomId, count) {
  RoomMessageRead.findOneAndUpdate(
    { userId, roomId },
    { $set: { readCount: count } },
    { upsert: true }
  ).catch((err) =>
    console.error('[UnreadCacheService] persist readCount error:', err.message)
  );
}

async function setRoomReadCount(userId, roomId, count) {
  const clamped = Math.max(0, count);
  const all = messageCache.get(readKey(userId)) ?? {};
  all[roomId] = clamped;
  messageCache.set(readKey(userId), all, TTL);
  persistRoomReadCount(userId, roomId, clamped);
  return clamped;
}

async function roomUnread(userId, roomId) {
  const [total, read] = await Promise.all([
    MessageCountCacheService.getRoomCount(roomId),
    getRoomReadCount(userId, roomId),
  ]);
  return Math.max(0, (total ?? 0) - (read ?? 0));
}

const UnreadCacheService = {
  getAll(userId) {
    return messageCache.get(privKey(userId)) ?? null;
  },

  async getAllWithRooms(userId, roomIds = []) {
    const privateCounts = this.getAll(userId) ?? {};
    const roomPairs = await Promise.all(
      roomIds.map(async (roomId) => [`room_${roomId}`, await roomUnread(userId, roomId)])
    );
    const merged = { ...privateCounts };
    for (const [chatKey, count] of roomPairs) {
      if (count > 0) merged[chatKey] = count;
    }
    return merged;
  },

  seed(userId, counts) {
    const existing = messageCache.get(privKey(userId));
    if (existing !== null) return;
    const privateOnly = {};
    for (const [chatKey, count] of Object.entries(counts || {})) {
      if (!isRoomKey(chatKey)) privateOnly[chatKey] = count;
    }
    messageCache.set(privKey(userId), privateOnly, TTL);
  },

  increment(userId, chatKey) {
    if (isRoomKey(chatKey)) return;
    const existing = messageCache.get(privKey(userId)) ?? {};
    existing[chatKey] = (existing[chatKey] ?? 0) + 1;
    messageCache.set(privKey(userId), existing, TTL);
  },

  async reset(userId, chatKey) {
    if (isRoomKey(chatKey)) {
      const roomId = roomIdOf(chatKey);
      const total = await MessageCountCacheService.getRoomCount(roomId);
      await setRoomReadCount(userId, roomId, total ?? 0);
      return 0;
    }
    const existing = messageCache.get(privKey(userId));
    if (!existing || !existing[chatKey]) return 0;
    delete existing[chatKey];
    messageCache.set(privKey(userId), existing, TTL);
    return 0;
  },

  async decrement(userId, chatKey, by = 1) {
    if (isRoomKey(chatKey)) {
      const roomId = roomIdOf(chatKey);
      const [total, read] = await Promise.all([
        MessageCountCacheService.getRoomCount(roomId),
        getRoomReadCount(userId, roomId),
      ]);
      const nextRead = Math.min(total ?? 0, (read ?? 0) + Math.max(0, by));
      await setRoomReadCount(userId, roomId, nextRead);
      return Math.max(0, (total ?? 0) - nextRead);
    }
    const existing = messageCache.get(privKey(userId)) ?? {};
    const current = existing[chatKey] ?? 0;
    const next = Math.max(0, current - Math.max(0, by));
    if (next === 0) {
      delete existing[chatKey];
    } else {
      existing[chatKey] = next;
    }
    messageCache.set(privKey(userId), existing, TTL);
    return next;
  },

  async seedRoomOnJoin(userId, roomId) {
    const total = await MessageCountCacheService.getRoomCount(roomId);
    await setRoomReadCount(userId, roomId, total ?? 0);
    return 0;
  },

  set(userId, counts) {
    messageCache.set(privKey(userId), { ...counts }, TTL);
  },

  invalidate(userId) {
    messageCache.delete(privKey(userId));
    messageCache.delete(readKey(userId));
  },
};

export default UnreadCacheService;
