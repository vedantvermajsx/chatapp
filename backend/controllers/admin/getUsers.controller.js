import User from '../../models/user.model.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { parsePagination } from '../../utils/analytics/parsePagination.js';

const USER_FIELDS = 'username email avatar gender role isOnline lastSeen createdAt';

export async function getUsers(req, res) {
  try {
    const { search = '', filter = 'all' } = req.query;
    const { page, limit } = parsePagination(req.query);

    const query = {};
    const term = String(search).trim();
    if (term) {
      const rx = new RegExp(escapeRegex(term), 'i');
      query.$or = [{ username: rx }, { email: rx }];
    }
    if (filter === 'online') query.isOnline = true;
    if (filter === 'admin') query.role = 'admin';

    const [users, total] = await Promise.all([
      User.find(query, USER_FIELDS)
        .sort({ lastSeen: -1 })
        .skip(page * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page, limit, hasMore: (page + 1) * limit < total });
  } catch (err) {
    console.error('[admin/users] error:', err.message);
    res.status(500).json({ message: 'Failed to load users' });
  }
}
