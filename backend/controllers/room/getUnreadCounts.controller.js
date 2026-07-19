import unreadCacheClient from '../../database/unreadCacheClient.js';

export async function getUnreadCounts(req, res) {
  try {
    let counts = {};
    try {
      const cached = await unreadCacheClient.getAll(req.user._id);
      counts = cached.counts || {};
    } catch (cacheErr) {
      console.warn('[getUnreadCounts] cache error, returning empty counts:', cacheErr.message);
    }
    res.json(counts);
  } catch (err) {
    console.error('[getUnreadCounts] error:', err);
    res.status(200).json({}); 
  }
}
