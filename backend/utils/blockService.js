import blockCacheClient from '../database/blockCacheClient.js';
import { getClientIp } from './clientIp.js';
import { enqueueUserIp } from './queueClient.js';
import { getBan } from './ban/getBan.js';

export function recordUserIp(req, userId, username) {
  const ip = getClientIp(req);
  if (!ip) return;
  enqueueUserIp({ ip, userId: String(userId), username });
}

export const getIpsForUser = (userId) => blockCacheClient.getUserIps(userId);
export const isBlockedBetween = (senderId, receiverId, senderIp = null) =>
  blockCacheClient.isBlockedPrivate(senderId, receiverId, senderIp);
export const isBlockedInRoom = (roomId, senderId, senderIp = null) =>
  blockCacheClient.isBlockedInRoom(roomId, senderId, senderIp);

export const getActiveBan = (userId, ip = null) => getBan(userId, ip);
