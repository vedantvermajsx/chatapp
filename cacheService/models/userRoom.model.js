import mongoose from 'mongoose';

const userRoomSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  roomIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }]
});

export default mongoose.models.UserRoom || mongoose.model('UserRoom', userRoomSchema);
