
import { messageCache } from './CacheService.js';

const TTL = null; 

function key(userId) {
  return `unread:${userId}`;
}

const UnreadCacheService = {
    getAll(userId) {
    return messageCache.get(key(userId)) ?? null; 
  },

    seed(userId, counts) {
    const existing = messageCache.get(key(userId));
    if (existing !== null) return; 
    messageCache.set(key(userId), { ...counts }, TTL);
  },

    increment(userId, chatKey) {
    const existing = messageCache.get(key(userId)) ?? {};
    existing[chatKey] = (existing[chatKey] ?? 0) + 1;
    messageCache.set(key(userId), existing, TTL);
  },

    reset(userId, chatKey) {
    const existing = messageCache.get(key(userId));
    if (!existing || !existing[chatKey]) return 0;
    delete existing[chatKey];
    messageCache.set(key(userId), existing, TTL);
    return 0;
  },

    decrement(userId, chatKey, by = 1) {
    const existing = messageCache.get(key(userId)) ?? {};
    const current = existing[chatKey] ?? 0;
    const next = Math.max(0, current - Math.max(0, by));

    if (next === 0) {
      delete existing[chatKey];
    } else {
      existing[chatKey] = next;
    }
    messageCache.set(key(userId), existing, TTL);
    return next;
  },

    incrementForMembers(memberIds, senderId, chatKey) {
    for (const memberId of memberIds) {
      if (String(memberId) === String(senderId)) continue;
      this.increment(memberId, chatKey);
    }
  },

    set(userId, counts) {
    messageCache.set(key(userId), { ...counts }, TTL);
  },

    invalidate(userId) {
    messageCache.delete(key(userId));
  }
};

export default UnreadCacheService;
