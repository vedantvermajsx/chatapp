import UnreadCacheService from '../../services/UnreadCacheService.js';

export const resetUnread = async (req, res) => {
  const { userId } = req.params;
  const { chatKey } = req.body;
  if (!chatKey) return res.status(400).json({ message: 'chatKey required' });
  const count = await UnreadCacheService.reset(userId, chatKey);
  res.json({ ok: true, count });
};
