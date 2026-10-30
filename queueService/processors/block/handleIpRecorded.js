import UserIp from '../../models/userIp.model.js';

export async function handleIpRecorded({ ip, userId, username }) {
  if (!ip || !userId) return;
  const uid = String(userId);

  for (let attempt = 0; attempt < 2; attempt++) {
    const now = new Date();
    const updated = await UserIp.updateOne(
      { ip, 'users.userId': uid },
      { $set: { 'users.$.lastSeen': now, 'users.$.username': username } }
    );
    if (updated.matchedCount > 0) return;
    try {
      await UserIp.updateOne(
        { ip },
        { $push: { users: { userId: uid, username, lastSeen: now } } },
        { upsert: true }
      );
      return;
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
}
