import UnreadCacheService from '../../services/UnreadCacheService.js';

export const resetMultipleUnread = async (req, res) => {
  const { userIds, chatKey } = req.body;
  if (!chatKey) return res.status(400).json({ message: 'chatKey required' });
  if (!Array.isArray(userIds)) return res.status(400).json({ message: 'userIds must be an array' });

  await Promise.all(userIds.map(userId => UnreadCacheService.reset(userId, chatKey)));
  
  res.json({ ok: true });
};
