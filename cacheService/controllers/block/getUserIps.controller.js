import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const getUserIps = wrap('getUserIps', async (req, res) => {
  res.json({ ips: await blockCache.getUserIps(req.params.userId) });
});
