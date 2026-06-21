import userCacheService from '../../services/UserCacheService.js';

export const updateUser = async (req, res) => {
  try {
    const updated = await userCacheService.updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
