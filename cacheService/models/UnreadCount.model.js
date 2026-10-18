import mongoose from 'mongoose';

// Keep in sync with queueService/models/UnreadCount.model.js.
// cacheService only ever writes readCount (monotonic $max); queueService owns totalCount.
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
unreadCountSchema.index({ receiverId: 1 });

export default mongoose.models.UnreadCount ||
  mongoose.model('UnreadCount', unreadCountSchema);
