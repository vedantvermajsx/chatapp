import Report from '../../models/report.model.js';

export async function dismissReport(req, res) {
  try {
    const reportId = String(req.params.reportId);
    const updated = await Report.updateOne(
      { _id: reportId },
      { $set: { status: 'dismissed', action: { type: 'dismiss', byAdmin: req.user.username, at: new Date() } } }
    );
    if (!updated.matchedCount) return res.status(404).json({ message: 'Report not found' });
    return res.status(200).json({ message: 'Report dismissed' });
  } catch (err) {
    console.error('[dismissReport] error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
