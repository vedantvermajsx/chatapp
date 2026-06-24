import { dbRooms } from './indexedDB/rooms.db.js';
import { dbPrivateChats } from './indexedDB/privateChats.db.js';
import { dbMessages } from './indexedDB/messages.db.js';
import { dbPendingMessages } from './indexedDB/pendingMessages.db.js';
import { deleteDB } from './indexedDB/core.js';

export const dbService = {
  ...dbRooms,
  ...dbPrivateChats,
  ...dbMessages,
  ...dbPendingMessages,
  clearAllData: deleteDB
};
