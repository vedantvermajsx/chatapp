import mongoose from 'mongoose';

const roomBlockSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  ips: { type: [String], default: [] },
}, { timestamps: true });

roomBlockSchema.index({ roomId: 1, userId: 1 }, { unique: true });
roomBlockSchema.index({ roomId: 1, ips: 1 });

export default mongoose.models.RoomBlock || mongoose.model('RoomBlock', roomBlockSchema);
