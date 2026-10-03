import { readStateCache } from './CacheService.js';
import MessageCountCacheService from './MessageCountCacheService.js';
import RoomMessageRead from '../models/roomMessageRead.model.js';
import Message from '../models/message.model.js';

// Serialise read-modify-write per (user, room). Without this, concurrent decrements on a
// cold cache read the same value and one update is lost (and DB writes can land out of order).
const locks = new Map();
async function withLock(key, fn) {
  const prev = locks.get(key) ?? Promise.resolve();
  const run = prev.catch(() => {}).then(fn);
  const tail = run.catch(() => {});
  locks.set(key, tail);
  try { return await run; } finally { if (locks.get(key) === tail) locks.delete(key); }
}
const lockKey = (userId, roomId) => `${userId}:${roomId}`;

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
  const all = readStateCache.get(readKey(userId)) ?? {};
  if (Object.prototype.hasOwnProperty.call(all, roomId)) return all[roomId];

  const doc = await RoomMessageRead.findOne({ userId, roomId }).lean();
  let count = doc?.readCount;
  if (count === undefined || count === null) {
    // Doc created by queueService (lastRead upsert) without readCount: rebuild it from
    // lastReadAt instead of treating the whole room as unread.
    count = doc?.lastReadAt
      ? await Message.countDocuments({ roomId, isSystemMessage: { $ne: true }, timestamp: { $lte: doc.lastReadAt } })
      : 0;
  }
  all[roomId] = count;
  readStateCache.set(readKey(userId), all, TTL);
  return count;
}

async function setRoomReadCount(userId, roomId, count, total = Infinity) {
  const clamped = Math.min(Math.max(0, count), total);
  const all = readStateCache.get(readKey(userId)) ?? {};
  all[roomId] = clamped;
  readStateCache.set(readKey(userId), all, TTL);

  try {
    await RoomMessageRead.findOneAndUpdate(
      { userId, roomId },
      { $max: { readCount: clamped } }, // monotonic: out-of-order writes can't lower it
      { upsert: true }
    );
  } catch (err) {
    console.error('[UnreadCacheService] readCount persist error:', err.message);
  }

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
    return readStateCache.get(privKey(userId)) ?? null;
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
    const existing = readStateCache.get(privKey(userId));
    if (existing !== null) return;
    const privateOnly = {};
    for (const [chatKey, count] of Object.entries(counts || {})) {
      if (!isRoomKey(chatKey)) privateOnly[chatKey] = count;
    }
    readStateCache.set(privKey(userId), privateOnly, TTL);
  },

  increment(userId, chatKey) {
    if (isRoomKey(chatKey)) return;
    const existing = readStateCache.get(privKey(userId));
    // Cold cache: creating {chatKey:1} here would make getUnread think the map is already
    // seeded and skip the DB recompute, losing every unread from before the restart.
    if (existing === null) return;
    existing[chatKey] = (existing[chatKey] ?? 0) + 1;
    readStateCache.set(privKey(userId), existing, TTL);
  },

  async reset(userId, chatKey) {
    if (isRoomKey(chatKey)) {
      const roomId = roomIdOf(chatKey);
      return withLock(lockKey(userId, roomId), async () => {
        const total = await MessageCountCacheService.getRoomCount(roomId);
        await setRoomReadCount(userId, roomId, total ?? 0);
        return 0;
      });
    }
    const existing = readStateCache.get(privKey(userId));
    if (!existing || !existing[chatKey]) return 0;
    delete existing[chatKey];
    readStateCache.set(privKey(userId), existing, TTL);
    return 0;
  },

  async decrement(userId, chatKey, by = 1) {
    if (isRoomKey(chatKey)) {
      const roomId = roomIdOf(chatKey);
      return withLock(lockKey(userId, roomId), async () => {
        const [read, total] = await Promise.all([
          getRoomReadCount(userId, roomId),
          MessageCountCacheService.getRoomCount(roomId),
        ]);
        // Clamp to total: paging through old messages must never push readCount past the
        // real total, otherwise the next N new messages would show as 0 unread.
        const nextRead = Math.min((read ?? 0) + Math.max(0, by), total ?? 0);
        await setRoomReadCount(userId, roomId, nextRead, total ?? 0);
        return Math.max(0, (total ?? 0) - nextRead);
      });
    }
    const existing = readStateCache.get(privKey(userId));
    if (existing === null) return 0; // cold: don't create a partial map that blocks the DB seed
    const current = existing[chatKey] ?? 0;
    const next = Math.max(0, current - Math.max(0, by));
    if (next === 0) {
      delete existing[chatKey];
    } else {
      existing[chatKey] = next;
    }
    readStateCache.set(privKey(userId), existing, TTL);
    return next;
  },

  async seedRoomOnJoin(userId, roomId) {
    await withLock(lockKey(userId, roomId), async () => {
      const total = await MessageCountCacheService.getRoomCount(roomId);
      await setRoomReadCount(userId, roomId, total ?? 0);
    });
    readStateCache.delete(`userRooms:${userId}`);
    return 0;
  },

  set(userId, counts) {
    readStateCache.set(privKey(userId), { ...counts }, TTL);
  },

  invalidate(userId) {
    readStateCache.delete(privKey(userId));
    readStateCache.delete(readKey(userId));
    readStateCache.delete(`userRooms:${userId}`);
  },
};

export default UnreadCacheService;
