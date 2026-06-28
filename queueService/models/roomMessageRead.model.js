import mongoose from 'mongoose';

const roomMessageReadSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    roomId: { type: String, required: true },
    lastReadMessageId: { type: String, default: null },
    lastReadAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

roomMessageReadSchema.index({ userId: 1, roomId: 1 }, { unique: true });
roomMessageReadSchema.index({ roomId: 1 });

export default mongoose.models.RoomMessageRead ||
  mongoose.model('RoomMessageRead', roomMessageReadSchema);
