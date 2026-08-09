import mongoose from 'mongoose';

const userRoomSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  roomIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }]
});

userRoomSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.UserRoom || mongoose.model('UserRoom', userRoomSchema);
