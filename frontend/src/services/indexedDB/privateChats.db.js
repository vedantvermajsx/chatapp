import { getStore, promisifyRequest, STORES } from './core.js';

export const dbPrivateChats = {
  async savePrivateChats(privateChats) {
    try {
      const store = await getStore(STORES.privateChats, 'readwrite');
      store.clear();
      privateChats.forEach(chat => store.put({ ...chat, id: chat.otherUser.id }));
    } catch (error) {
      console.error('Error saving private chats:', error);
    }
  },

  async getPrivateChats() {
    try {
      const store = await getStore(STORES.privateChats);
      return promisifyRequest(store.getAll()).catch(() => []);
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
