import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blockerId: { type: String, required: true },
  blockedId: { type: String, required: true },
  blockedUsername: { type: String, required: true },
  ips: { type: [String], default: [] },
}, { timestamps: true });

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
blockSchema.index({ blockerId: 1, ips: 1 });
blockSchema.index({ blockedId: 1 });

export default mongoose.models.Block || mongoose.model('Block', blockSchema);
