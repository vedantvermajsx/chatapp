import UserCacheService from '../../services/UserCacheService.js';

export async function seedUser(req, res) {
  try {
    const userDoc = req.body;
    if (!userDoc._id || !userDoc.username) {
      return res.status(400).json({ message: '_id and username are required' });
    }
    UserCacheService.seedUser(userDoc);
    return res.json({ seeded: true });
  } catch (err) {
    console.error('[UserController] seedUser error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
