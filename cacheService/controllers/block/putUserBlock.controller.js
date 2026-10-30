import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const putUserBlock = wrap('putUserBlock', async (req, res) => {
  const { username, ips } = req.body || {};
  await blockCache.addUserBlock(req.params.blockerId, req.params.blockedId, username, Array.isArray(ips) ? ips : []);
  res.json({ ok: true });
});
