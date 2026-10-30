import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const checkRoom = wrap('checkRoom', async (req, res) => {
  const { roomId, senderId, senderIp } = req.body || {};
  if (!roomId || !senderId) return res.status(400).json({ message: 'roomId and senderId required' });
  res.json({ blocked: await blockCache.isBlockedInRoom(roomId, senderId, senderIp) });
});
