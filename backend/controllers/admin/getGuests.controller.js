import Guest from '../../models/guest.model.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { parsePagination } from '../../utils/analytics/parsePagination.js';

const GUEST_FIELDS = 'username avatar gender isOnline lastSeen createdAt';

export async function getGuests(req, res) {
  try {
    const { search = '' } = req.query;
    const { page, limit } = parsePagination(req.query);

    const query = {};
    const term = String(search).trim();
    if (term) query.username = new RegExp(escapeRegex(term), 'i');

    const [guests, total] = await Promise.all([
      Guest.find(query, GUEST_FIELDS)
        .sort({ lastSeen: -1 })
        .skip(page * limit)
        .limit(limit)
        .lean(),
      Guest.countDocuments(query),
    ]);

    res.json({ guests, total, page, limit, hasMore: (page + 1) * limit < total });
  } catch (err) {
    console.error('[admin/guests] error:', err.message);
    res.status(500).json({ message: 'Failed to load guests' });
  }
}
