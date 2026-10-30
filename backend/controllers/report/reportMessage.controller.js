import mongoose from 'mongoose';
import xss from 'xss';
import Report from '../../models/report.model.js';
import userCacheClient from '../../database/userCacheClient.js';

const REASONS = ['profanity', 'harassment', 'spam', 'hate', 'sexual', 'violence', 'other'];

export async function reportMessage(req, res) {
  try {
    const reporter = req.user;
    const { messageId, reportedUserId, roomId, content, media, reason, note } = req.body || {};

    if (!reportedUserId) {
      return res.status(400).json({ message: 'reportedUserId required' });
    }
    if (String(reportedUserId) === String(reporter._id)) {
      return res.status(400).json({ message: 'Cannot report your own message' });
    }

    const target = await userCacheClient.getUserById(String(reportedUserId));

    const report = await Report.create({
      _id: new mongoose.Types.ObjectId().toString(),
      messageId: messageId ? String(messageId) : null,
      reporterId: String(reporter._id),
      reporterUsername: reporter.username || null,
      reportedUserId: String(reportedUserId),
      reportedUsername: target?.username || null,
      roomId: roomId ? String(roomId) : null,
      content: xss(String(content || '')).slice(0, 4000),
      media: media || null,
      reason: REASONS.includes(reason) ? reason : 'other',
      note: xss(String(note || '')).slice(0, 500),
    });

    return res.status(201).json({ message: 'Report submitted', reportId: report._id });
  } catch (err) {
    console.error('[reportMessage] error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
