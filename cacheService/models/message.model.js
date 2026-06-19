import mongoose from 'mongoose';

// Same schema/collection the queue service writes to. Kept in sync
// manually since these are two separate services/processes; if the
// schema changes, update both queueService/models/message.model.js and
// this file together.
const messageSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    senderId: { type: String, required: true },
    roomId: { type: String, default: null },
    receiverId: { type: String, default: null },
    content: { type: String, default: '' },
    media: {
      type: { type: String, enum: ['image', 'video', 'gif', 'audio'], default: null },
      url: { type: String, default: null }
    },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    }
  },
  { versionKey: false }
);

messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, senderId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, roomId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, roomId: 1, timestamp: -1 });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
