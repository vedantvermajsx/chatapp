import { getStore, promisifyRequest, STORES } from './core.js';

export const dbUnreadCounts = {
  async saveUnreadCounts(counts = {}) {
    try {
      const store = await getStore(STORES.unreadCounts, 'readwrite');
      store.clear();
      Object.entries(counts).forEach(([chatKey, count]) => {
        if (count > 0) store.put({ chatKey, count });
      });
    } catch (error) {
      console.error('Error saving unread counts:', error);
    }
  },

  async loadUnreadCounts() {
    try {
      const store = await getStore(STORES.unreadCounts);
      const rows = await promisifyRequest(store.getAll());
      const result = {};
      (rows || []).forEach(({ chatKey, count }) => {
        if (count > 0) result[chatKey] = count;
      });
      return result;
    } catch (error) {
      console.error('Error loading unread counts:', error);
      return {};
    }
  },
};
