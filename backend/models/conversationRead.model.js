import mongoose from 'mongoose';

const conversationReadSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
      immutable: true
    },

    receiverId: {
      type: String,
      required: true,
      immutable: true
    },

    messageId: {
      type: String,
      ref: 'Message',
      default: null
    },

    lastSeenAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

conversationReadSchema.index(
  {
    senderId: 1,
    receiverId: 1
  },
  {
    unique: true
  }
);

export default mongoose.models.ConversationRead ||
  mongoose.model('ConversationRead', conversationReadSchema);