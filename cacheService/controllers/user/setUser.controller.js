import userCacheService from '../../services/UserCacheService.js';

export const setUser = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const data = req.body.data || req.body;
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }
    userCacheService.setUser(id, data);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
