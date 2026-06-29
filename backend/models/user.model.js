import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  gender: { type: Number, required: true },
  bio: { type: String, default: '' },
  avatar: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);