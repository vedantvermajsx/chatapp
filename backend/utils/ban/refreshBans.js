import blockCacheClient from '../../database/blockCacheClient.js';
import { rebuildBans } from './rebuildBans.js';

export async function refreshBans() {
  try {
    rebuildBans(await blockCacheClient.listBans());
  } catch (err) {
    console.error('[ban] refresh failed:', err.message);
  }
}
