import unreadCacheClient from '../../database/unreadCacheClient.js';

export async function getUnreadCounts(req, res) {
  try {
    const cached = await unreadCacheClient.getAll(req.user._id);
    res.json(cached.counts);
  } catch (err) {
    console.error('[getUnreadCounts] error:', err);
    res.status(500).json({ message: err.message });
  }
}
