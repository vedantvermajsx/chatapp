export const syncUnreadFromResponse = (setUnreadCounts, chatKey, unreadCount) => {
  if (typeof unreadCount !== 'number' || !setUnreadCounts || !chatKey) return;

  setUnreadCounts(prev => {
    const current = prev[chatKey] || 0;
    if (unreadCount <= 0) {
      if (!(chatKey in prev)) return prev;
      const next = { ...prev };
      delete next[chatKey];
      return next;
    }
    if (current === unreadCount) return prev;
    return { ...prev, [chatKey]: unreadCount };
  });
};
