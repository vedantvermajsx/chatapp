import Message from '../models/message.model.js';
import { connectDB } from '../database/db.js';
import {appendMessageCache } from '../cacheClient.js';

export const processMessageBatch = async (batch) => {
  await connectDB();

  const messagesToInsert = batch.map((msg) => ({
    ...msg,
    _id: msg.uuid
  }));

  let insertedCount = 0;
  try {
    const saved = await Message.insertMany(messagesToInsert, { ordered: false });
    insertedCount = saved.length;
  } catch (err) {
    insertedCount = err.insertedDocs?.length ?? 0;
    if (insertedCount < messagesToInsert.length) {
      console.error(
        `[MessageQueue] ${messagesToInsert.length - insertedCount} message(s) in batch failed to save:`,
        err.message
      );
    }
  }

  console.log(`[MessageQueue] saved ${insertedCount}/${messagesToInsert.length} messages to MongoDB`);

  const invalidationTargets = new Map();
  for (const msg of batch) {
    const key = msg.roomId
      ? `room:${msg.roomId}`
      : `private:${[msg.senderId, msg.receiverId].sort().join(':')}`;

    if (!invalidationTargets.has(key)) {
      invalidationTargets.set(key, {
        roomId: msg.roomId || null,
        senderId: msg.roomId ? null : msg.senderId,
        receiverId: msg.roomId ? null : msg.receiverId,
        messages: []
      });
    }
    invalidationTargets.get(key).messages.push(msg);
  }

  await Promise.all(
    [...invalidationTargets.values()].map((target) => appendMessageCache(target))
  );
};
