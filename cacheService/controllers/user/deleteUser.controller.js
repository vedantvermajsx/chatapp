import userCacheService from '../../services/UserCacheService.js';

export const deleteUser = async (req, res) => {
  try {
    await userCacheService.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
