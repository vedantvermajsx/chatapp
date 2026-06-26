import mongoose from 'mongoose';

const unreadCountSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
      index: true,
    },

    senderType: {
      type: String,
      enum: ['User', 'Guest', 'Room'],
      required: true,
    },

    receiverId: {
      type: String,
      required: true,
      index: true,
    },

    receiverType: {
      type: String,
      enum: ['User', 'Guest'],
      required: true,
    },

    count: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastUnreadAt: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: false, updatedAt: 'updatedAt' },
  }
);

unreadCountSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

unreadCountSchema.index({ receiverId: 1, count: 1 });

unreadCountSchema.statics.increment = function (
  senderId,
  senderType,
  receiverId,
  receiverType,
  timestamp = new Date()
) {
  return this.findOneAndUpdate(
    { senderId, receiverId },
    {
      $inc: { count: 1 },
      $set: { senderType, receiverType, lastUnreadAt: timestamp },
    },
    { upsert: true, new: true }
  );
};


unreadCountSchema.statics.reset = function (senderId, receiverId) {
  return this.findOneAndUpdate(
    { senderId, receiverId },
    { $set: { count: 0, lastUnreadAt: null } },
    { new: true }
  );
};

unreadCountSchema.statics.clearChat = function (senderId, receiverId) {
  // No upsert — if no document exists there is nothing to clear.
  return this.findOneAndUpdate(
    { senderId, receiverId },
    { $set: { count: 0, lastUnreadAt: null } },
    { new: true }
  );
};

unreadCountSchema.statics.getAllForReceiver = function (receiverId) {
  return this.find(
    { receiverId, count: { $gt: 0 } },
    { senderId: 1, senderType: 1, count: 1, lastUnreadAt: 1, _id: 0 }
  ).lean();
};

export default mongoose.models.UnreadCount ||
  mongoose.model('UnreadCount', unreadCountSchema);
