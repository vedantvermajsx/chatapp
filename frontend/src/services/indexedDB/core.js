export const DB_NAME = 'GatherUpDB';
export const DB_VERSION = 7; 
export const MAX_MESSAGES_PER_CHAT = 100;
// Recently used stickers + GIFs (combined) kept locally so they work offline.
export const MAX_RECENT_STICKERS = 100;

export const STORES = {
  rooms: 'rooms',
  privateChats: 'privateChats',
  messages: 'messages',
  pendingMessages: 'pendingMessages',
  pendingFiles: 'pendingFiles',
  chatMeta: 'chatMeta',
  unreadCounts: 'unreadCounts',
  keys: 'keys',
  recentStickers: 'recentStickers',
};

let dbInstance = null;

const clearedHooks = [];
export const onStoresCleared = (fn) => { clearedHooks.push(fn); };
export const notifyStoresCleared = () => clearedHooks.forEach((fn) => { try { fn(); } catch {} });

export const openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) { resolve(dbInstance); return; }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error opening database');
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('IndexedDB open blocked by another connection');
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      dbInstance.onclose = () => {
        dbInstance = null;
      };
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

      if (!db.objectStoreNames.contains(STORES.keys)) {
        db.createObjectStore(STORES.keys, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.recentStickers)) {
        const recentStore = db.createObjectStore(STORES.recentStickers, { keyPath: 'key' });
        recentStore.createIndex('usedAt', 'usedAt', { unique: false });
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

export const sortByStoredOrder = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      row,
      order: typeof row?.__order === 'number' ? row.__order : Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ row }) => {
      const { __order, ...rest } = row;
      return rest;
    });
};

export const deleteDB = () => {
  return clearAllStores();
};

export const clearAllStores = async () => {
  const storeNames = Object.values(STORES);
  const db = await openDB();
  const existing = storeNames.filter(name => db.objectStoreNames.contains(name));
  if (existing.length === 0) return;

  await new Promise((resolve, reject) => {
    const tx = db.transaction(existing, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    existing.forEach(name => tx.objectStore(name).clear());
  });
  notifyStoresCleared();
};

export const hardResetDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    notifyStoresCleared();
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
};

const OWNER_KEY = 'gatherup.dbOwner';

// The local DB belongs to one user. If a different user signs in, wipe it so no chat data leaks across accounts.
// wipeIfUnknown: on a fresh login with no owner stamp (legacy data) we can't prove ownership, so wipe.
export const ensureDBOwner = async (userId, { wipeIfUnknown = false } = {}) => {
  if (!userId) return;
  const id = String(userId);
  let owner = null;
  try { owner = localStorage.getItem(OWNER_KEY); } catch { /* ignore */ }
  if (owner !== id && (owner || wipeIfUnknown)) {
    try {
      await clearAllStores();
    } catch (error) {
      console.error('clearAllStores failed, deleting database instead:', error);
      await hardResetDB();
    }
  }
  try { localStorage.setItem(OWNER_KEY, id); } catch { /* ignore */ }
};
