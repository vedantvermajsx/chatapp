import UserCacheService from '../../services/UserCacheService.js';

export async function searchUsers(req, res) {
  try {
    const { q, limit, excludeId } = req.query;

    if (!q || !q.trim()) {
      return res.json([]);
    }

    const results = await UserCacheService.searchUsers(q, limit, { excludeId });
    return res.json(results);
  } catch (err) {
    console.error('[UserController] searchUsers error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
