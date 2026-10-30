import Block from '../../models/block.model.js';

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
