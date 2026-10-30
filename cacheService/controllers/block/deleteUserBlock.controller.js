import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const deleteUserBlock = wrap('deleteUserBlock', async (req, res) => {
  await blockCache.removeUserBlock(req.params.blockerId, req.params.blockedId);
  res.json({ ok: true });
});
