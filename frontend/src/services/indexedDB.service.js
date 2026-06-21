const DB_NAME = 'whisprgramDB';
const DB_VERSION = 2;
const STORES = {
  rooms: 'rooms',
  privateChats: 'privateChats',
  messages: 'messages',
  pendingMessages: 'pendingMessages'
};

let dbInstance = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error opening database');
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
    const db = event.target.result;

    if (!db.objectStoreNames.contains(STORES.rooms)) {
      const roomStore = db.createObjectStore(STORES.rooms, { keyPath: '_id' });
      roomStore.createIndex('searchQuery', 'searchQuery', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.privateChats)) {
      db.createObjectStore(STORES.privateChats, { keyPath: 'id' });
    }

    if (!db.objectStoreNames.contains(STORES.messages)) {
      const messageStore = db.createObjectStore(STORES.messages, { keyPath: 'id' });
      messageStore.createIndex('chatKey', 'chatKey', { unique: false });
      messageStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.pendingMessages)) {
      const pendingStore = db.createObjectStore(STORES.pendingMessages, { keyPath: 'id' });
      pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
  };
  });
};

const getStore = async (storeName, mode = 'readonly') => {
  const db = await openDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const dbService = {
  async saveRooms(rooms, searchQuery = '') {
    try {
      const store = await getStore(STORES.rooms, 'readwrite');
      const index = store.index('searchQuery');
      const cursorRequest = index.openCursor(IDBKeyRange.only(searchQuery));
      cursorRequest.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          store.delete(cursor.value._id);
          cursor.continue();
        }
      };
      rooms.forEach(room => {
        store.put({ ...room, searchQuery });
      });
    } catch (error) {
      console.error('Error saving rooms to IndexedDB:', error);
    }
  },

  async getRooms(searchQuery = '') {
    try {
      const store = await getStore(STORES.rooms);
      const index = store.index('searchQuery');
      const request = index.getAll(searchQuery);
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve([]);
      });
    } catch (error) {
      console.error('Error getting rooms from IndexedDB:', error);
      return [];
    }
  },

  async savePrivateChats(privateChats) {
    try {
      const store = await getStore(STORES.privateChats, 'readwrite');
      
      store.clear();
      
      privateChats.forEach(chat => {
        store.put({ ...chat, id: chat.otherUser.id });
      });
    } catch (error) {
      console.error('Error saving private chats to IndexedDB:', error);
    }
  },

  async getPrivateChats() {
    try {
      const store = await getStore(STORES.privateChats);
      const request = store.getAll();
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve([]);
      });
    } catch (error) {
      console.error('Error getting private chats from IndexedDB:', error);
      return [];
    }
  },

  async saveMessages(chatKey, messages, hasMore = false) {
    try {
      const store = await getStore(STORES.messages, 'readwrite');
      const index = store.index('chatKey');
      const cursorRequest = index.openCursor(IDBKeyRange.only(chatKey));
      cursorRequest.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          store.delete(cursor.value.id);
          cursor.continue();
        }
      };
      messages.forEach(msg => {
        store.put({ ...msg, chatKey, hasMore });
      });
    } catch (error) {
      console.error('Error saving messages to IndexedDB:', error);
    }
  },

  async getMessages(chatKey) {
    try {
      const store = await getStore(STORES.messages);
      const index = store.index('chatKey');
      const request = index.getAll(chatKey);
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          const hasMore = result.length > 0 ? result[0].hasMore : false;
          resolve({ messages: result, hasMore });
        };
        request.onerror = () => resolve({ messages: [], hasMore: false });
      });
    } catch (error) {
      console.error('Error getting messages from IndexedDB:', error);
      return { messages: [], hasMore: false };
    }
  },

  async addMessage(chatKey, message) {
    try {
      const store = await getStore(STORES.messages, 'readwrite');
      store.put({ ...message, chatKey });
    } catch (error) {
      console.error('Error adding message to IndexedDB:', error);
    }
  },
  
  async addPendingMessage(pendingMsg) {
    try {
      const store = await getStore(STORES.pendingMessages, 'readwrite');
      store.put(pendingMsg);
    } catch (error) {
      console.error('Error adding pending message to IndexedDB:', error);
    }
  },
  
  async getPendingMessages() {
    try {
      const store = await getStore(STORES.pendingMessages);
      const index = store.index('timestamp');
      const request = index.getAll();
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve([]);
      });
    } catch (error) {
      console.error('Error getting pending messages from IndexedDB:', error);
      return [];
    }
  },
  
  async removePendingMessage(id) {
    try {
      const store = await getStore(STORES.pendingMessages, 'readwrite');
      store.delete(id);
    } catch (error) {
      console.error('Error removing pending message from IndexedDB:', error);
    }
  },

  async deletePrivateChat(id) {
    try {
      const store = await getStore(STORES.privateChats, 'readwrite');
      store.delete(id);
    } catch (error) {
      console.error('Error deleting private chat from IndexedDB:', error);
    }
  },

  async deleteMessages(chatKey) {
    try {
      const store = await getStore(STORES.messages, 'readwrite');
      const index = store.index('chatKey');
      const cursorRequest = index.openCursor(IDBKeyRange.only(chatKey));
      cursorRequest.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          store.delete(cursor.value.id);
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('Error deleting messages from IndexedDB:', error);
    }
  }
};
