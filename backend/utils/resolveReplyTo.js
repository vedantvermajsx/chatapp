import Message from '../models/message.model.js';
import userCacheClient from '../database/userCacheClient.js';
import { messageCacheClient } from '../database/messageCacheClient.js';

function toPreview(original, username) {
  return {
    messageId: String(original.id ?? original._id),
    senderId: original.senderId,
    username: username || 'Unknown',
    text: original.text ?? original.content ?? '',
    media: original.media?.type ? { type: original.media.type } : null,
    iv: original.iv || null,
    senderKeyWrapped: original.senderKeyWrapped || null,
    receiverKeyWrapped: original.receiverKeyWrapped || null,
    wrappedKey: original.wrappedKey || null,
  };
}

/**
 * Resolves a replyTo message id into a lightweight preview object
 * shaped the same way the frontend expects (username/text/media/senderId),
 * so it survives being cached and re-fetched later, and so every
 * recipient (not just the sender's own optimistic UI) can render
 * the quoted message.
 *
 * IMPORTANT: messages are end-to-end encrypted — the backend never has
 * the keys to decrypt `content`. So `text` here is still ciphertext; we
 * also carry along whatever encryption metadata (iv / senderKeyWrapped /
 * receiverKeyWrapped / wrappedKey) the original message has, so the
 * client can decrypt the quoted preview the same way it decrypts the
 * message itself.
 *
 * Where we look it up: messages are written to the cache service
 * synchronously (private messages) / within a short ~200ms batch window
 * (room messages) as part of the send request itself, whereas they only
 * land in MongoDB later via an async broker -> queueService batch flush
 * (every ~500ms). So the cache service is the reliable, near-immediate
 * source of truth here — Mongo is only a fallback for the rare cold-cache
 * case (e.g. cache eviction/restart, or replying to a very old message).
 *
 * `context` tells us where to look:
 *   { type: 'private', userA, userB } - the two participants of the DM
 *   { type: 'room', roomId }
 */
export async function resolveReplyTo(replyToId, context) {
  if (!replyToId || !context) return null;

  try {
    let found = null;
    let username = null;

    if (context.type === 'private') {
      const { userA, userB } = context;
      found = await messageCacheClient.getPrivateMessage(userA, userB, replyToId).catch(() => null);
      if (!found) {
        found = await messageCacheClient.getPrivateMessage(userB, userA, replyToId).catch(() => null);
      }
    } else if (context.type === 'room') {
      found = await messageCacheClient.getRoomMessage(context.roomId, replyToId).catch(() => null);
    }

    if (found?.senderId) {
      const sender = await userCacheClient.getUserById(found.senderId);
      username = sender?.username || null;
      return toPreview(found, username);
    }

    // Cold-cache fallback: go straight to Mongo. No retry loop needed here
    // since we already tried the fast, reliably-populated cache path above.
    const original = await Message.findById(replyToId).lean();
    if (!original) {
      console.warn(`[resolveReplyTo] message ${replyToId} not found in cache or Mongo`);
      return null;
    }

    const sender = await userCacheClient.getUserById(original.senderId);
    return toPreview({ ...original, id: original._id }, sender?.username);
  } catch (err) {
    console.error('[resolveReplyTo] error:', err.message);
    return null;
  }
}



