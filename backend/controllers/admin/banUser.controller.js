import userCacheClient from '../../database/userCacheClient.js';
import blockCacheClient from '../../database/blockCacheClient.js';
import { enqueueUserBanned } from '../../utils/queueClient.js';
import Report from '../../models/report.model.js';

const MIN_DURATION_MS = 60 * 1000;

export async function banUser(req, res) {
  try {
    const userId = String(req.params.userId);
    const { durationMs = null, reason = '', reportId = null } = req.body || {};

    const target = await userCacheClient.getUserById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role === 'admin') return res.status(400).json({ message: 'Cannot block an admin' });

    const ms = Number(durationMs);
    if (!Number.isFinite(ms) || ms < MIN_DURATION_MS) {
      return res.status(400).json({ message: 'A valid block duration is required' });
    }

    const expiresAt = new Date(Date.now() + ms);
    const ban = { userId, username: target.username, reason, expiresAt };

    enqueueUserBanned(ban);
    await blockCacheClient.addBan(userId, { username: target.username, reason, expiresAt })
      .catch(err => console.warn('[banUser] cache update failed:', err.message));

    if (reportId) {
      await Report.updateOne(
        { _id: String(reportId) },
        {
          $set: {
            status: 'actioned',
            action: { durationMs: ms, expiresAt, byAdmin: req.user.username, at: new Date() },
          },
        }
      ).catch(err => console.warn('[banUser] report update failed:', err.message));
    }

    return res.status(200).json({ message: 'User blocked', expiresAt });
  } catch (err) {
    console.error('[banUser] error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
