import Message from '../../models/message.model.js';

export const processMessageBatch = async (batch) => {

  let insertedCount = 0;

  try {
    const saved = await Message.insertMany(batch, { ordered: false });
    insertedCount = saved.length;
  } catch (err) {
    insertedCount = err.insertedDocs?.length ?? 0;

    if (insertedCount < batch.length) {
      console.error(
        `[MessageProcessor] ${batch.length - insertedCount} message(s) failed to save:`,
        err.message
      );
    }
  }

  console.log(
    `[MessageProcessor] saved ${insertedCount}/${batch.length} messages to MongoDB`
  );
};