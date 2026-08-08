import Message from '../models/message.model.js';
import userCacheClient from '../database/userCacheClient.js';

export async function resolveReplyTo(replyToId) {
  if (!replyToId) return null;

  try {
    const original = await Message.findById(replyToId).lean();
    if (!original) return null;

    const sender = await userCacheClient.getUserById(original.senderId);

    return {
      messageId: String(original._id),
      senderId: original.senderId,
      username: sender?.username || 'Unknown',
      text: original.content || '',
      media: original.media?.type ? { type: original.media.type } : null,
    };
  } catch (err) {
    console.error('[resolveReplyTo] error:', err.message);
    return null;
  }
}
