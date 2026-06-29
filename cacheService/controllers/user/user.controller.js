
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



export async function invalidateUserCache(req, res) {
  try {
    UserCacheService.invalidate(req.params.id);
    return res.json({ invalidated: true });
  } catch (err) {
    console.error('[UserController] invalidateUserCache error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
