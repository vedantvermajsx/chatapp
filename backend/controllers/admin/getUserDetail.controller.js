import User from '../../models/user.model.js';
import Guest from '../../models/guest.model.js';
import { getUserActivityStats } from '../../utils/analytics/getUserActivityStats.js';

export async function getUserDetail(req, res) {
  try {
    const { userId } = req.params;
    const isGuest = String(userId).startsWith('guest_');
    const Model = isGuest ? Guest : User;

    const user = await Model.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    delete user.password;
    delete user.privateKeyEncrypted;
    delete user.keySalt;

    const stats = await getUserActivityStats(userId, user.createdAt);

    res.json({ user, stats: { type: isGuest ? 'guest' : 'user', ...stats } });
  } catch (err) {
    console.error('[admin/user-detail] error:', err.message);
    res.status(500).json({ message: 'Failed to load user' });
  }
}
