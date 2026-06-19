import User from '../../models/user.model.js';

export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Forbidden' });

    // Messages from this user are intentionally kept - they display
    // with a "Deleted User" fallback when the sender is not found.
    await User.findByIdAndDelete(userId);
    res.clearCookie('token');
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
