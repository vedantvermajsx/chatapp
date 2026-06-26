import mongoose from 'mongoose';

/**
 * Tracks the last message a user has read in a given room.
 * Used to compute unread counts: messages newer than lastReadTimestamp are unread.
 */
const roomMessageReadSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    roomId: {
      type: String,
      required: true
    },
    // The _id of the last message this user has read
    lastReadMessageId: {
      type: String,
      default: null
    },
    // Denormalised timestamp of that message for fast range queries
    lastReadAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// One record per (user, room) pair
roomMessageReadSchema.index({ userId: 1, roomId: 1 }, { unique: true });
// Fast lookup by roomId for bulk unread calculation
roomMessageReadSchema.index({ roomId: 1 });

export default mongoose.models.RoomMessageRead ||
  mongoose.model('RoomMessageRead', roomMessageReadSchema);
