import UnreadCacheService from '../../services/UnreadCacheService.js';

export const incrementUnread = (req, res) => {
  const { userId } = req.params;
  const { chatKey } = req.body;
  if (!chatKey) return res.status(400).json({ message: 'chatKey required' });
  UnreadCacheService.increment(userId, chatKey);
  res.json({ ok: true });
};
