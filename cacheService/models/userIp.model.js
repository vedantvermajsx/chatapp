import mongoose from 'mongoose';

const userIpSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  users: [{
    _id: false,
    userId: { type: String, required: true },
    username: { type: String, required: true },
    lastSeen: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

userIpSchema.index({ 'users.userId': 1 });

export default mongoose.models.UserIp || mongoose.model('UserIp', userIpSchema);
