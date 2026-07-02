import UserCacheService from '../../services/UserCacheService.js';

export async function checkDuplicate(req, res) {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ message: 'username and email are required' });
    }
    const result = await UserCacheService.checkDuplicate(username, email);
    return res.json(result);
  } catch (err) {
    console.error('[UserController] checkDuplicate error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
