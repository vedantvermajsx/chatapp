import UserCacheService from '../../services/UserCacheService.js';

export async function invalidateUserCache(req, res) {
  try {
    UserCacheService.invalidate(req.params.id);
    return res.json({ invalidated: true });
  } catch (err) {
    console.error('[UserController] invalidateUserCache error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
