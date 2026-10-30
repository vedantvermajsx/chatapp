import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const checkPrivate = wrap('checkPrivate', async (req, res) => {
  const { senderId, receiverId, senderIp } = req.body || {};
  if (!senderId || !receiverId) return res.status(400).json({ message: 'senderId and receiverId required' });
  res.json({ blocked: await blockCache.isBlockedPrivate(senderId, receiverId, senderIp) });
});
