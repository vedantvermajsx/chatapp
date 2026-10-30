import blockCacheClient from '../../database/blockCacheClient.js';

export const isBlockedBy = (userId, peerId) =>
  blockCacheClient.isBlockedBy(userId, peerId);

export const isBlockedBetween = (senderId, receiverId, senderIp = null) =>
  blockCacheClient.isBlockedPrivate(senderId, receiverId, senderIp);
