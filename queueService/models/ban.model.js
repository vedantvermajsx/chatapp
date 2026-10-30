import mongoose from 'mongoose';

const banSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  reason: { type: String, default: '' },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

banSchema.index({ expiresAt: 1 });

export default mongoose.models.Ban || mongoose.model('Ban', banSchema);
