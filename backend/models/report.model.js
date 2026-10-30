import mongoose from 'mongoose';

const actionSchema = new mongoose.Schema({
  type: { type: String, default: null },
  durationMs: { type: Number, default: null },
  expiresAt: { type: Date, default: null },
  byAdmin: { type: String, default: null },
  at: { type: Date, default: null },
}, { _id: false });

const reportSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  messageId: { type: String, default: null },
  reporterId: { type: String, required: true },
  reporterUsername: { type: String, default: null },
  reportedUserId: { type: String, required: true },
  reportedUsername: { type: String, default: null },
  roomId: { type: String, default: null },
  content: { type: String, default: '' },
  media: { type: mongoose.Schema.Types.Mixed, default: null },
  reason: { type: String, default: 'other' },
  note: { type: String, default: '' },
  status: { type: String, enum: ['open', 'actioned', 'dismissed'], default: 'open' },
  action: { type: actionSchema, default: null },
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedUserId: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model('Report', reportSchema);
