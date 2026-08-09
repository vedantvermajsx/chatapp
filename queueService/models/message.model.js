import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },

    senderId: {
      type: String,
      required: true,
      index: true
    },

    receiverId: {
      type: String,
      default: null,
      index: true
    },

    roomId: {
      type: String,
      default: null,
      index: true
    },

    content: {
      type: String,
      default: ''
    },

    iv: { type: String, default: null },
    senderKeyWrapped: { type: String, default: null },
    receiverKeyWrapped: { type: String, default: null },
    wrappedKey: { type: String, default: null },

    taggedUser: {
      type: String,
      default: null
    },
    replyTo: {
      type: new mongoose.Schema(
        {
          messageId: { type: String, default: null },
          senderId: { type: String, default: null },
          username: { type: String, default: null },
          text: { type: String, default: null },
          media: { type: mongoose.Schema.Types.Mixed, default: null },
          iv: { type: String, default: null },
          senderKeyWrapped: { type: String, default: null },
          receiverKeyWrapped: { type: String, default: null },
          wrappedKey: { type: String, default: null },
        },
        { _id: false }
      ),
      default: null
    },

    isSystemMessage: {
      type: Boolean,
      default: false,
      immutable: true,
      index: true
    },

    systemType: {
      type: String,
      enum: [
        'call',
        'missed-call',
        'member-joined',
        'member-left',
        'room-created',
        'room-renamed',
        'room-deleted'
      ],
      default: null,
      immutable: true,
      index: true
    },

    media: {
      type: {
        type: String,
        enum: ['image', 'video', 'gif', 'audio','sticker'],
        default: null
      },
      url: {
        type: String,
        default: null
      }
    },

    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true
    },

    deletedFor: [
      {
        type: String,
        ref: 'User'
      }
    ]
  },
  {
    versionKey: false,
    minimize: true
  }
);


messageSchema.index({ roomId: 1, timestamp: -1 });

messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, senderId: 1, timestamp: -1 });

messageSchema.index({ isSystemMessage: 1, timestamp: -1 });
messageSchema.index({ systemType: 1, timestamp: -1 });

messageSchema.index({ deletedFor: 1 });


export default mongoose.models.Message ||
  mongoose.model('Message', messageSchema);