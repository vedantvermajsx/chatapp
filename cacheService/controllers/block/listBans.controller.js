import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const listBans = wrap('listBans', async (req, res) => {
  res.json({ bans: await blockCache.listBans() });
});
