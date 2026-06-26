/**
 * UnreadCacheService
 *
 * Stores unread message counts per user as a flat hash in the in-memory cache:
 *   key:   unread:{userId}
 *   value: { "room_{roomId}": N, "private_{senderId}": N, ... }
 *
 * TTL: 7 days (604800s) — reset on every write so active users never expire.
 *
 * All operations are O(1) — no MongoDB queries at read time.
 */

import { messageCache } from './CacheService.js';

const TTL = 604800; // 7 days in seconds

function key(userId) {
  return `unread:${userId}`;
}

const UnreadCacheService = {
  /**
   * Get all unread counts for a user.
   * Returns {} if no entry exists (cache cold).
   */
  getAll(userId) {
    return messageCache.get(key(userId)) ?? null; // null = cache miss (needs DB fallback)
  },

  /**
   * Seed the cache from a pre-computed object (used by getUnreadCounts on cold start).
   * Only sets if not already present — avoids overwriting live increments.
   */
  seed(userId, counts) {
    const existing = messageCache.get(key(userId));
    if (existing !== null) return; // already warm, don't overwrite
    messageCache.set(key(userId), { ...counts }, TTL);
  },

  /**
   * Increment unread count for a specific chatKey for a user.
   * chatKey: "room_{roomId}" | "private_{senderId}"
   */
  increment(userId, chatKey) {
    const existing = messageCache.get(key(userId)) ?? {};
    existing[chatKey] = (existing[chatKey] ?? 0) + 1;
    messageCache.set(key(userId), existing, TTL);
  },

  /**
   * Reset unread count for a specific chatKey to 0 (user read the chat).
   */
  reset(userId, chatKey) {
    const existing = messageCache.get(key(userId));
    if (!existing || !existing[chatKey]) return;
    delete existing[chatKey];
    messageCache.set(key(userId), existing, TTL);
  },

  /**
   * Bulk-increment: for a new room message, increment for all member userIds
   * except the sender.
   */
  incrementForMembers(memberIds, senderId, chatKey) {
    for (const memberId of memberIds) {
      if (String(memberId) === String(senderId)) continue;
      this.increment(memberId, chatKey);
    }
  },

  /**
   * Replace the entire counts object for a user (used for full refresh).
   */
  set(userId, counts) {
    messageCache.set(key(userId), { ...counts }, TTL);
  },

  /**
   * Delete cache entry for a user (force re-seed from DB on next read).
   */
  invalidate(userId) {
    messageCache.delete(key(userId));
  }
};

export default UnreadCacheService;
