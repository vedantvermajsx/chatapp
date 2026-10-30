import Report from '../../models/report.model.js';
import { parsePagination } from '../../utils/analytics/parsePagination.js';

const STATUSES = ['open', 'actioned', 'dismissed'];

export async function getReports(req, res) {
  try {
    const { page, limit } = parsePagination(req.query);
    const status = STATUSES.includes(req.query.status) ? req.query.status : 'open';

    const filter = { status };
    const [reports, total] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).skip(page * limit).limit(limit).lean(),
      Report.countDocuments(filter),
    ]);

    res.json({ reports, total, page, limit, hasMore: (page + 1) * limit < total });
  } catch (err) {
    console.error('[admin/reports] error:', err.message);
    res.status(500).json({ message: 'Failed to load reports' });
  }
}
