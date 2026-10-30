import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import keyManager from '../../services/keyManager.js';
import { decryptPrivateMessage } from '../../utils/crypto.js';
import { mergeByKey } from '../../utils/mergeCollections.js';
import { recordBlockFrom403, clearPrivateChatBlock } from '../../utils/blockCache.js';

const chatKey = (chat) => chat?.otherUser?.id ?? chat?.otherUser?._id;

async function decryptLastMessage(lastMessage, selfId, privateKeyPem) {
  if (!lastMessage || !lastMessage.iv) return lastMessage;

  const { iv, senderKeyWrapped, receiverKeyWrapped, content, ...rest } = lastMessage;

  const isOwn = String(lastMessage.senderId) === String(selfId);
  const wrappedKeyForMe = isOwn ? senderKeyWrapped : receiverKeyWrapped;

  if (!wrappedKeyForMe || !privateKeyPem) {
    return { ...rest, content: '🔒 Encrypted message' };
  }

  try {
    const decryptedContent = await decryptPrivateMessage(content, iv, wrappedKeyForMe, privateKeyPem);
    return { ...rest, content: decryptedContent };
  } catch (err) {
    console.error('[loadPrivateChats] lastMessage decrypt failed:', err.message);
    return { ...rest, content: '🔒 Encrypted message' };
  }
}

export const loadPrivateChatsHandler = async (setPrivateChats, setLoadingPrivateChats) => {
  const cachedChats = await dbService.getPrivateChats();

  if (cachedChats.length > 0) {
    setPrivateChats(prev => mergeByKey(prev, cachedChats, chatKey));
  } else {
    setLoadingPrivateChats(true);
  }

  let privateChats = cachedChats;

  try {
    const raw = await messageService.getPrivateChats();

    const selfId = keyManager.getSelfId();
    const privateKeyPem = await keyManager.getSelfPrivateKey();

    const res = await Promise.all(raw.map(async (chat) => {
      const decryptedLastMessage = await decryptLastMessage(chat.lastMessage, selfId, privateKeyPem);
      return {
        ...chat,
        lastMessage: decryptedLastMessage,
        otherUser: {
          ...chat.otherUser,
          id: chat.otherUser.id || chat.otherUser._id,
        },
      };
    }));

    // ── Seed the frontend block cache from the authoritative list ──
    for (const chat of res) {
      const userId = chat.otherUser?.id || chat.otherUser?._id;
      if (!userId) continue;
      if (chat.isBlockedBy) {
        // Populate block cache without an expiresAt (user-level block, not a timed ban)
        recordBlockFrom403('blocked', { userId, message: 'You cannot message this user' });
      } else {
        clearPrivateChatBlock(userId);
      }
    }
    // ──────────────────────────────────────────────────────────────

    // Y merged into X — never a wholesale replacement.
    setPrivateChats(prev => mergeByKey(prev, res, chatKey));
    privateChats = mergeByKey(cachedChats, res, chatKey);
    await dbService.savePrivateChats(res);
  } catch (error) {
    // If we didn't already load from cache above, try again
    if (cachedChats.length === 0) {
      const fallback = await dbService.getPrivateChats();
      if (fallback.length > 0) {
        setPrivateChats(prev => mergeByKey(prev, fallback, chatKey));
        privateChats = fallback;
      }
    }
    console.error('Failed to load private chats:', error);
  } finally {
    setLoadingPrivateChats(false);
  }
  return { privateChats };
};
