import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    gender: { type: Number, required: true },
    age: { type: Number, required: true },
    password: { type: String, required: true },
    avatar: { type: String, default: null },
    isOnline: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

guestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export default mongoose.models.Guest || mongoose.model('Guest', guestSchema);
