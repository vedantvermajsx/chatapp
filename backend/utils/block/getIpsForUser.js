import blockCacheClient from '../../database/blockCacheClient.js';

export const getIpsForUser = (userId) => blockCacheClient.getUserIps(userId);
