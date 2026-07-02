import MessageCountCacheService from '../../services/MessageCountCacheService.js';

export const invalidatePrivateCount = (req, res) => {
  const { senderId, receiverId } = req.params;
  MessageCountCacheService.invalidatePrivate(senderId, receiverId);
  res.json({ ok: true });
};
