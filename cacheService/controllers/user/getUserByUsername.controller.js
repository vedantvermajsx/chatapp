import UserCacheService from '../../services/UserCacheService.js';

export async function getUserByUsername(req, res) {
  try {
    const user = await UserCacheService.getUserByUsername(req.params.name);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('[UserController] getUserByUsername error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
