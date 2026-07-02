import UserCacheService from '../../services/UserCacheService.js';

export async function getUserById(req, res) {
  try {
    const user = await UserCacheService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('[UserController] getUserById error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
