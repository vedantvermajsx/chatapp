import UnreadCacheService from '../../services/UnreadCacheService.js';

export const decrementUnread = async (req, res) => {
  const { userId } = req.params;
  const { chatKey, by } = req.body;
  if (!chatKey) return res.status(400).json({ message: 'chatKey required' });
  const count = await UnreadCacheService.decrement(userId, chatKey, Number(by) || 1);
  res.json({ ok: true, count });
};
