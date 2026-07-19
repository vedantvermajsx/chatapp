import userCacheService from '../../services/UserCacheService.js';
import bloomFilter, { emailBloom } from '../../services/BloomfilterService.js';

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email } = req.body;
    userCacheService.deleteUser(userId);
    if (username) {
      bloomFilter.remove(username);
    }
    if (email) {
      emailBloom.remove(email);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
