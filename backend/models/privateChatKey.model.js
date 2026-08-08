import mongoose from 'mongoose';

const privateChatKeySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  participants: { type: [String], required: true },
  publicKey: { type: String, default: null },
  privateKeyEncrypted: { type: String, default: null, select: false },
}, { timestamps: true });

privateChatKeySchema.index({ participants: 1 });

export default mongoose.models.PrivateChatKey || mongoose.model('PrivateChatKey', privateChatKeySchema);
