/**
 * LastReadCacheService
 *
 * Caches the last-read position per user per chat.
 *
 * Key schema:
 *   lastRead:{userId}:room_{roomId}     → { messageId, lastReadAt }
 *   lastRead:{userId}:private_{peerId}  → { messageId, lastSeenAt }
 *
 * TTL: 7 days. On cold-miss the caller is expected to load from Mongo
 * and call set() — the service never hits Mongo itself.
 */

import { messageCache } from './CacheService.js';
import ConversationRead from '../models/conversationRead.model.js';
import RoomMessageRead from '../models/roomMessageRead.model.js';

const TTL = 604800; // 7 days

function key(userId, chatKey) {
  return `lastRead:${userId}:${chatKey}`;
}

const LastReadCacheService = {
  // ── getters ────────────────────────────────────────────────────────────────

  /** Returns cached value or null (cache cold). */
  get(userId, chatKey) {
    return messageCache.get(key(userId, chatKey));
  },

  /**
   * Cache-first read with Mongo fallback.
   * chatKey: "room_{roomId}" | "private_{peerId}"
   */
  async getOrLoad(userId, chatKey) {
    const cached = messageCache.get(key(userId, chatKey));
    if (cached !== null) return cached;

    // Cold — load from Mongo
    let record = null;

    if (chatKey.startsWith('room_')) {
      const roomId = chatKey.slice(5);
      record = await RoomMessageRead.findOne({ userId, roomId })
        .select('lastReadMessageId lastReadAt')
        .lean();
      if (record) {
        const val = { messageId: record.lastReadMessageId, lastReadAt: record.lastReadAt };
        messageCache.set(key(userId, chatKey), val, TTL);
        return val;
      }
    } else if (chatKey.startsWith('private_')) {
      const senderId = chatKey.slice(8);
      record = await ConversationRead.findOne({ senderId, receiverId: userId })
        .select('messageId lastSeenAt')
        .lean();
      if (record) {
        const val = { messageId: record.messageId, lastSeenAt: record.lastSeenAt };
        messageCache.set(key(userId, chatKey), val, TTL);
        return val;
      }
    }

    return null;
  },

  // ── setters ────────────────────────────────────────────────────────────────

  setRoom(userId, roomId, { messageId, lastReadAt }) {
    messageCache.set(key(userId, `room_${roomId}`), { messageId, lastReadAt }, TTL);
  },

  setPrivate(userId, peerId, { messageId, lastSeenAt }) {
    messageCache.set(key(userId, `private_${peerId}`), { messageId, lastSeenAt }, TTL);
  },

  // ── invalidation ───────────────────────────────────────────────────────────

  invalidate(userId, chatKey) {
    messageCache.delete(key(userId, chatKey));
  },

  invalidateAllForUser(userId, chatKeys = []) {
    for (const ck of chatKeys) {
      messageCache.delete(key(userId, ck));
    }
  }
};

export default LastReadCacheService;
