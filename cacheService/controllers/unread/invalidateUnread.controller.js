import UnreadCacheService from '../../services/UnreadCacheService.js';

export const invalidateUnread = (req, res) => {
  const { userId } = req.params;
  UnreadCacheService.invalidate(userId);
  res.json({ ok: true });
};
