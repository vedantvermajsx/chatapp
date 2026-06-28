/**
 * MessageCountCacheService
 *
 * Caches total message count per chat conversation.
 *
 * Key schema:
 *   msgCount:room_{roomId}              → number
 *   msgCount:private_{sortedIds}        → number   (ids sorted so A↔B == B↔A)
 *
 * On cold-miss the service loads the count from MongoDB and seeds the cache.
 * Increments are done in-memory (O(1)); no Mongo write on each message.
 * TTL: 1 hour — counts are soft-state and recomputed on expiry.
 */

import { messageCache } from './CacheService.js';
import Message from '../models/message.model.js';

const TTL = 3600;

function roomKey(roomId)             { return `msgCount:room_${roomId}`; }
function privateKey(a, b)            { return `msgCount:private_${[a, b].sort().join(':')}`; }

const MessageCountCacheService = {
  // ── Room ──────────────────────────────────────────────────────────────────

  async getRoomCount(roomId) {
    const k = roomKey(roomId);
    const cached = messageCache.get(k);
    if (cached !== null) return cached;

    const count = await Message.countDocuments({ roomId });
    messageCache.set(k, count, TTL);
    return count;
  },

  incrementRoom(roomId) {
    const k = roomKey(roomId);
    const cur = messageCache.get(k);
    if (cur !== null) messageCache.set(k, cur + 1, TTL);
    // if cold, skip — will be computed fresh on next getRoomCount
  },

  invalidateRoom(roomId) {
    messageCache.delete(roomKey(roomId));
  },

  // ── Private ───────────────────────────────────────────────────────────────

  async getPrivateCount(senderId, receiverId) {
    const k = privateKey(senderId, receiverId);
    const cached = messageCache.get(k);
    if (cached !== null) return cached;

    const count = await Message.countDocuments({
      roomId: null,
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });
    messageCache.set(k, count, TTL);
    return count;
  },

  incrementPrivate(senderId, receiverId) {
    const k = privateKey(senderId, receiverId);
    const cur = messageCache.get(k);
    if (cur !== null) messageCache.set(k, cur + 1, TTL);
  },

  invalidatePrivate(senderId, receiverId) {
    messageCache.delete(privateKey(senderId, receiverId));
  }
};

export default MessageCountCacheService;
