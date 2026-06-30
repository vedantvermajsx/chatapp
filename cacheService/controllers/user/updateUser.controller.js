import userCacheService from '../../services/UserCacheService.js';

export const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await userCacheService.updateUser(id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
