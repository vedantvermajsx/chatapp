import mongoose from 'mongoose';

const conversationKeySchema = new mongoose.Schema({
  conversationId: { type: String, required: true }, // roomId
  conversationType: { type: String, enum: ['room'], required: true, default: 'room' },
  userId: { type: String, required: true },
  wrappedKey: { type: String, required: true, select: false },
}, { timestamps: true });

conversationKeySchema.index({ conversationId: 1, userId: 1, conversationType: 1 }, { unique: true });

export default mongoose.models.ConversationKey || mongoose.model('ConversationKey', conversationKeySchema);
