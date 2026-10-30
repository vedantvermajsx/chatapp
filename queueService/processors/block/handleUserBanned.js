import Ban from '../../models/ban.model.js';

export async function handleUserBanned({ userId, username, reason = '', expiresAt = null }) {
  if (!userId) return;
  const uid = String(userId);
  try {
    await Ban.updateOne(
      { userId: uid },
      { $set: { username, reason, expiresAt: expiresAt ? new Date(expiresAt) : null } },
      { upsert: true }
    );
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
}
