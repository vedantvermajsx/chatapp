import blockCacheClient from '../../database/blockCacheClient.js';

export const isBlockedBetween = (senderId, receiverId, senderIp = null) =>
  blockCacheClient.isBlockedPrivate(senderId, receiverId, senderIp);
