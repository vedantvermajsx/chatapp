import userModel from '../../models/user.model.js';
import userCacheClient from '../../database/userCacheClient.js';

export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    if (req.user._id !== userId && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Forbidden' });

    const deleted = await userModel.findByIdAndDelete(userId).lean();

    userCacheClient
      .deleteUserById(userId, { username: deleted?.username, email: deleted?.email })
      .catch(() => {});
    res.clearCookie('token');
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
