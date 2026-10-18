import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../database/db.js';
import Message from '../models/message.model.js';
import ConversationRead from '../models/conversationRead.model.js';
import UnreadCount from '../models/UnreadCount.model.js';

dotenv.config();

const baseMatch = { roomId: null, receiverId: { $ne: null }, isSystemMessage: { $ne: true } };

async function main() {
  await connectDB();

  const pairs = await Message.aggregate([
    { $match: baseMatch },
    { $group: { _id: { senderId: '$senderId', receiverId: '$receiverId' }, totalCount: { $sum: 1 } } },
  ]);

  const reads = new Map();
  for await (const r of ConversationRead.find({}, { senderId: 1, receiverId: 1, lastSeenAt: 1 }).lean().cursor()) {
    if (r.lastSeenAt) reads.set(`${r.senderId}|${r.receiverId}`, r.lastSeenAt);
  }

  let ops = [];
  let done = 0;
  const flush = async () => {
    if (!ops.length) return;
    await UnreadCount.bulkWrite(ops, { ordered: false });
    done += ops.length;
    ops = [];
  };

  for (const { _id: { senderId, receiverId }, totalCount } of pairs) {
    const seenAt = reads.get(`${senderId}|${receiverId}`);
    const readCount = seenAt
      ? await Message.countDocuments({ ...baseMatch, senderId, receiverId, timestamp: { $lte: seenAt } })
      : 0;

    ops.push({
      updateOne: {
        filter: { senderId, receiverId },
        update: {
          $set: { totalCount, readCount },
          $unset: { count: '', senderType: '', receiverType: '', lastUnreadAt: '' },
        },
        upsert: true,
      },
    });
    if (ops.length >= 500) await flush();
  }
  await flush();

  // Legacy docs for pairs with no messages left (e.g. old Room-type rows) are meaningless now.
  const stale = await UnreadCount.collection.deleteMany({ totalCount: { $exists: false } });

  await UnreadCount.syncIndexes(); // drops the old {receiverId, count} index, adds {receiverId}
  console.log(`[backfill] upserted ${done} pairs, removed ${stale.deletedCount} legacy docs`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[backfill] failed:', err);
  process.exit(1);
});
