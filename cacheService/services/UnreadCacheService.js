import { readStateCache } from './CacheService.js';
import MessageCountCacheService from './MessageCountCacheService.js';
import RoomMessageRead from '../models/roomMessageRead.model.js';
import Message from '../models/message.model.js';
import UnreadCount from '../models/UnreadCount.model.js';

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

const privateLoads = new Map();

function isPrivateKey(chatKey) {
  return typeof chatKey === 'string' && chatKey.startsWith('private_');
}

function senderIdOf(chatKey) {
  return chatKey.slice('private_'.length);
}

async function loadPrivateState(userId) {
  const cached = readStateCache.get(privKey(userId));
  if (cached !== null) return cached;

  let pending = privateLoads.get(userId);
  if (!pending) {
    pending = UnreadCount.find({ receiverId: userId }, { senderId: 1, totalCount: 1, readCount: 1, _id: 0 })
      .lean()
      .then((docs) => {
        const state = {};
        for (const d of docs) {
          state[d.senderId] = { total: d.totalCount ?? 0, read: d.readCount ?? 0 };
        }
        readStateCache.set(privKey(userId), state, TTL);
        return state;
      })
      .finally(() => privateLoads.delete(userId));
    privateLoads.set(userId, pending);
  }
  return pending;
}

function unreadOf(entry) {
  return entry ? Math.max(0, entry.total - entry.read) : 0;
}

async function persistPrivateRead(receiverId, senderId, readCount) {
  // cacheService owns readCount only; $max keeps it monotonic against out-of-order writes.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await UnreadCount.updateOne(
        { senderId, receiverId },
        { $max: { readCount } },
        { upsert: true }
      );
      return;
    } catch (err) {
      if (err.code === 11000 && attempt === 0) continue; // raced with queueService's upsert
      console.error('[UnreadCacheService] private readCount persist error:', err.message);
      return;
    }
  }
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
  // { private_<senderId>: unread } for every private chat with unread > 0
  async getPrivateUnread(userId) {
    const state = await loadPrivateState(userId);
    const out = {};
    for (const [senderId, entry] of Object.entries(state)) {
      const n = unreadOf(entry);
      if (n > 0) out[`private_${senderId}`] = n;
    }
    return out;
  },

  async getAllWithRooms(userId, roomIds = []) {
    const [privateCounts, roomPairs] = await Promise.all([
      this.getPrivateUnread(userId),
      Promise.all(roomIds.map(async (roomId) => [`room_${roomId}`, await roomUnread(userId, roomId)])),
    ]);
    const merged = { ...privateCounts };
    for (const [chatKey, count] of roomPairs) {
      if (count > 0) merged[chatKey] = count;
    }
    return merged;
  },

  // A new message from chatKey's sender arrived: totalCount + 1 (in cache only;
  // queueService persists totalCount to the DB).
  increment(userId, chatKey) {
    if (!isPrivateKey(chatKey)) return;
    const state = readStateCache.get(privKey(userId));
    // Cold cache: skip. The next fetch loads totalCount/readCount from the DB.
    if (state === null) return;
    const senderId = senderIdOf(chatKey);
    const entry = state[senderId] ?? (state[senderId] = { total: 0, read: 0 });
    entry.total += 1;
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
    if (!isPrivateKey(chatKey)) return 0;

    const senderId = senderIdOf(chatKey);
    const state = await loadPrivateState(userId);
    const entry = state[senderId];
    if (!entry || entry.read >= entry.total) return 0;
    entry.read = entry.total; // everything received so far is now read
    await persistPrivateRead(userId, senderId, entry.read);
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
    if (!isPrivateKey(chatKey)) return 0;

    const senderId = senderIdOf(chatKey);
    const state = await loadPrivateState(userId);
    const entry = state[senderId];
    if (!entry) return 0;
    const nextRead = Math.min(entry.read + Math.max(0, by), entry.total);
    if (nextRead > entry.read) {
      entry.read = nextRead;
      await persistPrivateRead(userId, senderId, nextRead);
    }
    return unreadOf(entry);
  },

  async seedRoomOnJoin(userId, roomId) {
    await withLock(lockKey(userId, roomId), async () => {
      const total = await MessageCountCacheService.getRoomCount(roomId);
      await setRoomReadCount(userId, roomId, total ?? 0);
    });
    readStateCache.delete(`userRooms:${userId}`);
    return 0;
  },

  invalidate(userId) {
    readStateCache.delete(privKey(userId));
    readStateCache.delete(readKey(userId));
    readStateCache.delete(`userRooms:${userId}`);
  },
};

export default UnreadCacheService;
