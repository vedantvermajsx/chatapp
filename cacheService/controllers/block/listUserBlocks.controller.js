import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const listUserBlocks = wrap('listUserBlocks', async (req, res) => {
  res.json({ blocked: await blockCache.listUserBlocks(req.params.blockerId) });
});
