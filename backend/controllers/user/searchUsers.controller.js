import userCacheClient from '../../database/userCacheClient.js';

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 5;

export async function searchUsers(req, res) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (!q) {
      return res.json([]);
    }

    if (q.length > 30) {
      return res.status(400).json({ message: 'Search query is too long' });
    }

    let limit = parseInt(req.query.limit, 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = DEFAULT_LIMIT;
    limit = Math.min(limit, MAX_LIMIT);

    const results = await userCacheClient.searchUsers(q, limit, req.user?._id);

    return res.json(results);
  } catch (err) {
    console.error('[searchUsers] unexpected error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
