import userCacheService from '../../services/UserCacheService.js';

export const setUser = async (req, res) => {
  try {
    const { id, data } = req.body;
    if (!id || !data) {
      return res.status(400).json({ error: 'id and data are required' });
    }
    await userCacheService.setUser(id, data);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
