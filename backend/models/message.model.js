import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  senderId: { type: String, required: true },
  roomId: { type: String, default: null },
  receiverId: { type: String, default: null },
  content: { type: String, default: '' },
  media: {
    type: { type: String, enum: ['image', 'video', 'gif','audio'], default: null },
    url: { type: String, default: null }
  },
  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
});

messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, timestamp: -1 });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);