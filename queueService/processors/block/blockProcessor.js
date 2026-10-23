import UserIp from '../../models/userIp.model.js';
import Block from '../../models/block.model.js';
import RoomBlock from '../../models/roomBlock.model.js';

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

export async function handleUserBlocked({ blockerId, blockedId, blockedUsername, ips = [] }) {
  try {
    await Block.updateOne(
      { blockerId, blockedId },
      { $set: { blockedUsername }, $addToSet: { ips: { $each: ips } } },
      { upsert: true }
    );
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
}

export async function handleUserUnblocked({ blockerId, blockedId }) {
  await Block.deleteOne({ blockerId, blockedId });
}

export async function handleRoomUserBlocked({ roomId, userId, username, ips = [] }) {
  try {
    await RoomBlock.updateOne(
      { roomId, userId },
      { $set: { username }, $addToSet: { ips: { $each: ips } } },
      { upsert: true }
    );
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
}

export async function handleRoomUserUnblocked({ roomId, userId }) {
  await RoomBlock.deleteOne({ roomId, userId });
}
