import unreadCacheClient from '../database/unreadCacheClient.js';

export async function applyUnreadOnFetch({ userId, chatKey, hasMore, messages = [] }) {
  if (!userId || !chatKey) return 0;

  const unreadEligibleCount = messages.filter((m) => !m.isSystemMessage).length;

  try {
    if (hasMore === false) {
      const count = await unreadCacheClient.reset(userId, chatKey);
      return count ?? 0;
    } else if (unreadEligibleCount > 0) {
      const count = await unreadCacheClient.decrement(userId, chatKey, unreadEligibleCount);
      return count ?? 0;
    }
  } catch {
    return 0;
  }
  return 0;
}
