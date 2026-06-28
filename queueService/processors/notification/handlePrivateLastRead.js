import ConversationRead from '../../models/conversationRead.model.js';

export async function handlePrivateLastRead({ userId, peerId, messageId, lastSeenAt }) {
  if (!userId || !peerId) return;

  try {
    await ConversationRead.findOneAndUpdate(
      { senderId: userId, receiverId: peerId },
      { $set: { messageId, lastSeenAt: lastSeenAt ?? new Date(), timestamp: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[NotificationProcessor] private lastRead set error:', err.message);
  }
}
