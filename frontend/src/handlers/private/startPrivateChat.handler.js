import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';

export const startPrivateChatHandler = async (
  otherUser,
  user,
  setCurrentPrivateChat,
  setCurrentRoom,
  setShowMembersModal,
  setMessages,
  setLoadingMessages,
  setHasMoreMessages,
  messageCache,
  CACHE_TTL
) => {
  setCurrentPrivateChat(otherUser);
  setCurrentRoom(null);
  setShowMembersModal(false);

  const cacheKey = `private_${otherUser.id}`;

  const inMemory = messageCache.current[cacheKey];
  if (inMemory?.messages?.length && Date.now() - inMemory.timestamp < CACHE_TTL) {
    setMessages(inMemory.messages);
    setHasMoreMessages(inMemory.hasMore);
    setLoadingMessages(false);
    _fetchNewPrivateMessages(otherUser.id, cacheKey, inMemory, setMessages, setHasMoreMessages, messageCache);
    return;
  }

  const idbData = await dbService.getMessages(cacheKey);
  if (idbData.messages.length > 0) {
    setMessages(idbData.messages);
    setHasMoreMessages(idbData.hasMore);
    setLoadingMessages(false);
    messageCache.current[cacheKey] = {
      messages: idbData.messages,
      hasMore: idbData.hasMore,
      timestamp: Date.now(),
    };
    _fetchNewPrivateMessages(otherUser.id, cacheKey, messageCache.current[cacheKey], setMessages, setHasMoreMessages, messageCache);
    return;
  }

  setMessages([]);
  setLoadingMessages(true);
  try {
    const res = await messageService.getPrivateMessages(otherUser.id, 20);
    const messagesWithRead = applyLastRead(res.messages, res.lastRead);
    messageCache.current[cacheKey] = {
      messages: messagesWithRead,
      hasMore: res.hasMore,
      timestamp: Date.now(),
    };
    setMessages(messagesWithRead);
    setHasMoreMessages(res.hasMore);
    await dbService.saveMessages(cacheKey, messagesWithRead, res.hasMore);
  } catch (error) {
    const idbFallback = await dbService.getMessages(cacheKey);
    if (idbFallback.messages.length > 0) {
      setMessages(idbFallback.messages);
      setHasMoreMessages(idbFallback.hasMore);
    }
    console.error('Failed to load private messages:', error);
  } finally {
    setLoadingMessages(false);
  }
};

async function _fetchNewPrivateMessages(otherUserId, cacheKey, currentCache, setMessages, setHasMoreMessages, messageCache) {
  try {
    let latestTimestamp = currentCache.messages?.[currentCache.messages.length - 1]?.timestamp;
    if (!latestTimestamp) return;

    let mergedMessages = currentCache.messages;
    let lastRead = null;
    let keepGoing = true;
    let safety = 0; 

    while (keepGoing && safety < 50) {
      safety += 1;

      const res = await messageService.getPrivateMessages(otherUserId, 50, null, latestTimestamp);
      lastRead = res.lastRead ?? lastRead;
      if (!res.messages?.length) {
        keepGoing = res.hasMore ?? false;
        if (!keepGoing) break;
        continue;
      }

      const existingIds = new Set(mergedMessages.map(m => String(m.id)));
      const reallyNew = res.messages.filter(m => !existingIds.has(String(m.id)));

      if (reallyNew.length) {
        mergedMessages = [...mergedMessages, ...reallyNew];
        latestTimestamp = reallyNew[reallyNew.length - 1].timestamp;
        await dbService.mergeNewMessages(cacheKey, reallyNew);
      }

      keepGoing = res.hasMore;
    }

    if (lastRead) {
      mergedMessages = applyLastRead(mergedMessages, lastRead);
    }

    messageCache.current[cacheKey] = {
      messages: mergedMessages,
      hasMore: currentCache.hasMore,
      timestamp: Date.now(),
    };
    setMessages(mergedMessages);
  } catch {
  }
}
