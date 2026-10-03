import Message from '../../models/message.model.js';

const isDuplicateKey = (e) => e?.code === 11000;

export const processMessageBatch = async (batch) => {
  try {
    await Message.insertMany(batch, { ordered: false });
  } catch (err) {
    const writeErrors = err.writeErrors ?? err.result?.result?.writeErrors ?? [];
    const onlyDuplicates =
      isDuplicateKey(err) ||
      (writeErrors.length > 0 && writeErrors.every((w) => isDuplicateKey(w) || isDuplicateKey(w.err)));
    if (onlyDuplicates) return;

    console.error(`[MessageProcessor] batch of ${batch.length} failed:`, err.message);
    throw err; 
  }
};
