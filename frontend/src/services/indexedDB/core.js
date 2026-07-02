export const DB_NAME = 'hushlineDB';
export const DB_VERSION = 5; 
export const MAX_MESSAGES_PER_CHAT = 100;

export const STORES = {
  rooms: 'rooms',
  privateChats: 'privateChats',
  messages: 'messages',
  pendingMessages: 'pendingMessages',
  pendingFiles: 'pendingFiles',
  chatMeta: 'chatMeta',
  unreadCounts: 'unreadCounts',
};

let dbInstance = null;

export const openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) { resolve(dbInstance); return; }

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
      const oldVersion = event.oldVersion;

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
        messageStore.createIndex('chatKey_timestamp', ['chatKey', 'timestamp'], { unique: false });
      } else if (oldVersion < 3) {
        const tx = event.target.transaction;
        const store = tx.objectStore(STORES.messages);
        if (!store.indexNames.contains('chatKey_timestamp')) {
          store.createIndex('chatKey_timestamp', ['chatKey', 'timestamp'], { unique: false });
        }
      }

      if (!db.objectStoreNames.contains(STORES.pendingMessages)) {
        const pendingStore = db.createObjectStore(STORES.pendingMessages, { keyPath: 'id' });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.pendingFiles)) {
        db.createObjectStore(STORES.pendingFiles, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.chatMeta)) {
        db.createObjectStore(STORES.chatMeta, { keyPath: 'chatKey' });
      }

      if (!db.objectStoreNames.contains(STORES.unreadCounts)) {
        db.createObjectStore(STORES.unreadCounts, { keyPath: 'chatKey' });
      }
    };
  });
};

export const getStore = async (storeName, mode = 'readonly') => {
  const db = await openDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const getMultiStore = async (storeNames, mode = 'readwrite') => {
  const db = await openDB();
  const transaction = db.transaction(storeNames, mode);
  return storeNames.map(name => transaction.objectStore(name));
};

export const promisifyRequest = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const deleteDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve(); 
  });
};