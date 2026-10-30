import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const listRoomBlocks = wrap('listRoomBlocks', async (req, res) => {
  res.json({ blocked: await blockCache.listRoomBlocks(req.params.roomId) });
});
