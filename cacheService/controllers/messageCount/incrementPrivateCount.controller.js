import MessageCountCacheService from '../../services/MessageCountCacheService.js';

export const incrementPrivateCount = (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ error: 'senderId and receiverId required' });
  MessageCountCacheService.incrementPrivate(senderId, receiverId);
  res.json({ ok: true });
};
