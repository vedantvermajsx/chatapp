import { getStore, promisifyRequest, STORES } from './core.js';

export const dbPendingMessages = {
  async addPendingMessage(pendingMsg) {
    try {
      const store = await getStore(STORES.pendingMessages, 'readwrite');
      store.put(pendingMsg);
    } catch (error) {
      console.error('Error adding pending message:', error);
    }
  },

  async getPendingMessages() {
    try {
      const store = await getStore(STORES.pendingMessages);
      const index = store.index('timestamp');
      return promisifyRequest(index.getAll()).catch(() => []);
    } catch {
      return [];
    }
  },

  async removePendingMessage(id) {
    try {
      const store = await getStore(STORES.pendingMessages, 'readwrite');
      store.delete(id);
    } catch (error) {
      console.error('Error removing pending message:', error);
    }
  }
};
