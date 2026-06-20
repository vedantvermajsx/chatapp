import userModel from '../../models/user.model.js';
import userCacheClient from '../../database/userCacheClient.js';

export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Forbidden' });

    const user = await userCacheClient.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userModel.findByIdAndDelete(userId);

    await userCacheClient.deleteUser(userId);
    res.clearCookie('token');
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
