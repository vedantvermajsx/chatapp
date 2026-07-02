import UserCacheService from '../../services/UserCacheService.js';

export async function getUsersBatch(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.json({});
    const map = await UserCacheService.getUsersByIds(ids);
    return res.json(Object.fromEntries(map));
  } catch (err) {
    console.error('[UserController] getUsersBatch error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
