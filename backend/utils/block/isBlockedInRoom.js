import blockCacheClient from '../../database/blockCacheClient.js';

export const isBlockedInRoom = (roomId, senderId, senderIp = null) =>
  blockCacheClient.isBlockedInRoom(roomId, senderId, senderIp);
