import UnreadCacheService from '../../services/UnreadCacheService.js';

export const seedUnread = (req, res) => {
  const { userId } = req.params;
  const { counts } = req.body;
  if (!counts) return res.status(400).json({ message: 'counts required' });
  UnreadCacheService.seed(userId, counts);
  res.json({ ok: true });
};
