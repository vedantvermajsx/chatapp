import unreadCacheClient from '../database/unreadCacheClient.js';

export async function applyUnreadOnFetch({ userId, chatKey, hasMore, messages = [] }) {
  if (!userId || !chatKey) return null;

  const unreadEligibleCount = messages.filter((m) => !m.isSystemMessage).length;

  if (hasMore === false) {
    const count = await unreadCacheClient.reset(userId, chatKey);
    return typeof count === 'number' ? count : 0;
  }

  if (unreadEligibleCount > 0) {
    return unreadCacheClient.decrement(userId, chatKey, unreadEligibleCount);
  }

  return null;
}
