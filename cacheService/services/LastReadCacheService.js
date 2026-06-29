/**
 * LastReadCacheService
 *
 * Caches the last-read position per user per chat.
 *
 * Key schema:
 *   lastRead:{userId}:room_{roomId}     → { messageId, lastReadAt }
 *   lastRead:{userId}:private_{peerId}  → { messageId, timestamp, lastSeenAt }
 *
 * TTL: 7 days. Reads are cache-first with a Mongo fallback on cold-miss.
 * Writes are write-through: every set() persists to Mongo *and* refreshes
 * the cache, so this service is the single place that owns both the cache
 * and the durable copy of read-state — callers never touch the Mongo
 * models directly.
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
        .select('messageId timestamp lastSeenAt')
        .lean();
      if (record) {
        const val = {
          messageId: record.messageId,
          timestamp: record.timestamp,
          lastSeenAt: record.lastSeenAt,
        };
        messageCache.set(key(userId, chatKey), val, TTL);
        return val;
      }
    }

    return null;
  },

  // ── setters (write-through: Mongo + cache) ──────────────────────────────────

  async setRoom(userId, roomId, { messageId, lastReadAt }) {
    await RoomMessageRead.findOneAndUpdate(
      { userId, roomId },
      { $set: { lastReadMessageId: messageId ?? null, lastReadAt } },
      { upsert: true }
    );
    messageCache.set(key(userId, `room_${roomId}`), { messageId, lastReadAt }, TTL);
  },

  async setPrivate(userId, peerId, { messageId, timestamp, lastSeenAt }) {
    // userId = the reader, peerId = the author of the message being read.
    await ConversationRead.findOneAndUpdate(
      { senderId: peerId, receiverId: userId },
      { $set: { messageId, timestamp, lastSeenAt } },
      { upsert: true }
    );
    messageCache.set(key(userId, `private_${peerId}`), { messageId, timestamp, lastSeenAt }, TTL);
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
