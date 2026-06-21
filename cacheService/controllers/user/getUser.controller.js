import userCacheService from '../../services/UserCacheService.js';

export const getUser = async (req, res) => {
  try {
    const user = await userCacheService.getUserById(req.params.id);
    if (user?.notFound) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
