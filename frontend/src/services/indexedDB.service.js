import { dbRooms } from './indexedDB/rooms.db.js';
import { dbPrivateChats } from './indexedDB/privateChats.db.js';
import { dbMessages } from './indexedDB/messages.db.js';
import { dbPendingMessages } from './indexedDB/pendingMessages.db.js';
import { dbUnreadCounts } from './indexedDB/unreadCounts.db.js';
import { dbKeys } from './indexedDB/keys.db.js';
import { dbRecentStickers } from './indexedDB/recentStickers.db.js';
import { deleteDB, ensureDBOwner } from './indexedDB/core.js';

export const dbService = {
  ...dbRooms,
  ...dbPrivateChats,
  ...dbMessages,
  ...dbPendingMessages,
  ...dbUnreadCounts,
  ...dbKeys,
  ...dbRecentStickers,
  clearAllData: deleteDB,
  ensureOwner: ensureDBOwner
};