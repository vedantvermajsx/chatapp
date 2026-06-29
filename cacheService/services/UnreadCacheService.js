
import { messageCache } from './CacheService.js';

const TTL = 604800; 

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
    if (!existing || !existing[chatKey]) return;
    delete existing[chatKey];
    messageCache.set(key(userId), existing, TTL);
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
