import RoomBlock from '../../models/roomBlock.model.js';

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
