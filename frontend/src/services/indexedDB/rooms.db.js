import { getStore, promisifyRequest, STORES } from './core.js';

export const dbRooms = {
  async saveRooms(rooms, searchQuery = '') {
    try {
      const store = await getStore(STORES.rooms, 'readwrite');
      const index = store.index('searchQuery');
      const cursorReq = index.openCursor(IDBKeyRange.only(searchQuery));
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { store.delete(cursor.value._id); cursor.continue(); }
      };
      rooms.forEach(room => store.put({ ...room, searchQuery }));
    } catch (error) {
      console.error('Error saving rooms:', error);
    }
  },

  async getRooms(searchQuery = '') {
    try {
      const store = await getStore(STORES.rooms);
      const index = store.index('searchQuery');
      return promisifyRequest(index.getAll(searchQuery)).catch(() => []);
    } catch {
      return [];
    }
  },

  async saveJoinedRooms(rooms) {
    try {
      const store = await getStore(STORES.rooms, 'readwrite');
      // mark joined rooms with a special searchQuery key
      const index = store.index('searchQuery');
      const cursorReq = index.openCursor(IDBKeyRange.only('__joined__'));
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { store.delete(cursor.value._id); cursor.continue(); }
      };
      rooms.forEach(room => store.put({ ...room, searchQuery: '__joined__' }));
    } catch (error) {
      console.error('Error saving joined rooms:', error);
    }
  },

  async getCachedJoinedRooms() {
    try {
      const store = await getStore(STORES.rooms);
      const index = store.index('searchQuery');
      return promisifyRequest(index.getAll('__joined__')).catch(() => []);
    } catch {
      return [];
    }
  }
};
