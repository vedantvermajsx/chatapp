import blockCacheClient from '../../database/blockCacheClient.js';

export const getActiveBan = (userId) => blockCacheClient.checkBan(userId);
