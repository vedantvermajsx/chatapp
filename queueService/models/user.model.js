import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    gender: { type: Number, required: true },
    dob: { type: Date, required: true },
    password: { type: String, required: true },
    avatar: { type: String, default: null },
    bio: { type: String, default: '' },
    role: { type: String, default: 'user' },
    isOnline: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
