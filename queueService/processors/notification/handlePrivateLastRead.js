import ConversationRead from '../../models/conversationRead.model.js';

// Convention (must match cacheService LastReadCacheService / computePrivateFromDB):
//   senderId   = the peer whose messages were read
//   receiverId = the user who read them (the reader)
// userId here is the READER, peerId is the other party.
export async function handlePrivateLastRead({ userId, peerId, messageId, lastSeenAt }) {
  if (!userId || !peerId) return;

  const seenAt = lastSeenAt ? new Date(lastSeenAt) : new Date();

  try {
    // Only ever move the read marker forward.
    await ConversationRead.findOneAndUpdate(
      {
        senderId: peerId,
        receiverId: userId,
        $or: [{ lastSeenAt: null }, { lastSeenAt: { $lt: seenAt } }],
      },
      { $set: { messageId, lastSeenAt: seenAt, timestamp: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    // E11000: a doc already exists with a newer lastSeenAt -> nothing to do.
    if (err.code === 11000) return;
    console.error('[NotificationProcessor] private lastRead set error:', err.message);
    throw err; // let BatchQueue retry
  }
}
