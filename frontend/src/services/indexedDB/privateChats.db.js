import { getStore, promisifyRequest, sortByStoredOrder, STORES } from './core.js';

export const dbPrivateChats = {
  async savePrivateChats(privateChats) {
    try {
      if (!Array.isArray(privateChats)) return;
      const store = await getStore(STORES.privateChats, 'readwrite');
      privateChats.forEach((chat, index) => {
        const id = chat?.otherUser?.id || chat?.otherUser?._id;
        if (!id) return;
        store.put({ ...chat, id, __order: index });
      });
    } catch (error) {
      console.error('Error saving private chats:', error);
    }
  },

  async getPrivateChats() {
    try {
      const store = await getStore(STORES.privateChats);
      const rows = await promisifyRequest(store.getAll()).catch(() => []);
      return sortByStoredOrder(rows);
    } catch {
      return [];
    }
  },

  async deletePrivateChat(id) {
    try {
      const store = await getStore(STORES.privateChats, 'readwrite');
      store.delete(id);
    } catch (error) {
      console.error('Error deleting private chat:', error);
    }
  }
};
