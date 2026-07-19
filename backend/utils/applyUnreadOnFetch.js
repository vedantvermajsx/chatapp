import unreadCacheClient from '../database/unreadCacheClient.js';

export function applyUnreadOnFetch({ userId, chatKey, hasMore, messages = [] }) {
  if (!userId || !chatKey) return null;

  const unreadEligibleCount = messages.filter((m) => !m.isSystemMessage).length;

  if (hasMore === false) {
    unreadCacheClient.reset(userId, chatKey).catch(() => {});
  } else if (unreadEligibleCount > 0) {
    unreadCacheClient.decrement(userId, chatKey, unreadEligibleCount).catch(() => {});
  }
  return null;
}
