import UnreadCacheService from '../../services/UnreadCacheService.js';

/** GET /unread/:userId  — get all unread counts for a user */
export const getUnread = (req, res) => {
  const { userId } = req.params;
  const counts = UnreadCacheService.getAll(userId);
  // null means cache cold — backend should fall back to DB
  if (counts === null) {
    return res.status(404).json({ cold: true, counts: {} });
  }
  res.json({ cold: false, counts });
};

/** POST /unread/:userId/increment  — body: { chatKey } */
export const incrementUnread = (req, res) => {
  const { userId } = req.params;
  const { chatKey } = req.body;
  if (!chatKey) return res.status(400).json({ message: 'chatKey required' });
  UnreadCacheService.increment(userId, chatKey);
  res.json({ ok: true });
};

/** POST /unread/:userId/increment-members  — body: { memberIds, senderId, chatKey } */
export const incrementUnreadForMembers = (req, res) => {
  const { memberIds, senderId, chatKey } = req.body;
  if (!memberIds?.length || !chatKey) return res.status(400).json({ message: 'memberIds and chatKey required' });
  UnreadCacheService.incrementForMembers(memberIds, senderId, chatKey);
  res.json({ ok: true });
};

/** POST /unread/:userId/reset  — body: { chatKey } */
export const resetUnread = (req, res) => {
  const { userId } = req.params;
  const { chatKey } = req.body;
  if (!chatKey) return res.status(400).json({ message: 'chatKey required' });
  UnreadCacheService.reset(userId, chatKey);
  res.json({ ok: true });
};

/** POST /unread/:userId/seed  — body: { counts } — only seeds if cache is cold */
export const seedUnread = (req, res) => {
  const { userId } = req.params;
  const { counts } = req.body;
  if (!counts) return res.status(400).json({ message: 'counts required' });
  UnreadCacheService.seed(userId, counts);
  res.json({ ok: true });
};

/** DELETE /unread/:userId  — invalidate (force re-seed from DB next read) */
export const invalidateUnread = (req, res) => {
  const { userId } = req.params;
  UnreadCacheService.invalidate(userId);
  res.json({ ok: true });
};
