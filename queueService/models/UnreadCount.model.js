import mongoose from 'mongoose';
const unreadCountSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    totalCount: { type: Number, default: 0, min: 0 },
    readCount: { type: Number, default: 0, min: 0 },
  },
  {
    versionKey: false,
    timestamps: { createdAt: false, updatedAt: 'updatedAt' },
  }
);

unreadCountSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
// "all conversations of this receiver" -> the unread-count fetch
unreadCountSchema.index({ receiverId: 1 });

unreadCountSchema.statics.incrementTotal = async function (senderId, receiverId) {
  const run = () =>
    this.updateOne({ senderId, receiverId }, { $inc: { totalCount: 1 } }, { upsert: true });
  try {
    return await run();
  } catch (err) {
    // Two concurrent upserts raced on the unique index; the doc exists now, so retry once.
    if (err.code === 11000) return run();
    throw err;
  }
};

export default mongoose.models.UnreadCount ||
  mongoose.model('UnreadCount', unreadCountSchema);
