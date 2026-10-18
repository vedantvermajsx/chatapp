import { getStore, promisifyRequest, sortByStoredOrder, STORES } from './core.js';

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

  // Upsert only — never clears. Rooms leave the cache exclusively via deleteJoinedRoom.
  async saveJoinedRooms(rooms) {
    try {
      if (!Array.isArray(rooms)) return;
      const store = await getStore(STORES.rooms, 'readwrite');
      rooms.forEach((room, index) => {
        if (!room?._id) return;
        store.put({ ...room, searchQuery: '__joined__', __order: index });
      });
    } catch (error) {
      console.error('Error saving joined rooms:', error);
    }
  },

  async deleteJoinedRoom(id) {
    try {
      if (!id) return;
      const store = await getStore(STORES.rooms, 'readwrite');
      const req = store.get(id);
      req.onsuccess = () => {
        const rec = req.result;
        if (rec && rec.searchQuery === '__joined__') store.delete(id);
      };
    } catch (error) {
      console.error('Error deleting joined room:', error);
    }
  },

  async getCachedJoinedRooms() {
    try {
      const store = await getStore(STORES.rooms);
      const index = store.index('searchQuery');
      const rows = await promisifyRequest(index.getAll('__joined__')).catch(() => []);
      return sortByStoredOrder(rows);
    } catch {
      return [];
    }
  }
};
