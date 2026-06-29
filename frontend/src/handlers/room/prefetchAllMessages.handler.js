import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';

export const prefetchAllMessagesHandler = async (
  joinedRooms = [],
  privateChats = [],
  messageCache
) => {
  const CONCURRENCY = 4;

  const tasks = [
    ...joinedRooms.map(room => ({
      type: 'room',
      id: room._id,
      cacheKey: `room_${room._id}`
    })),
    ...privateChats.map(chat => ({
      type: 'private',
      id: chat.otherUser?.id,
      cacheKey: `private_${chat.otherUser?.id}`
    })).filter(t => t.id)
  ];

  
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const batch = tasks.slice(i, i + CONCURRENCY);
    await Promise.allSettled(batch.map(task => _prefetchChat(task, messageCache)));
  }
};

async function _prefetchChat({ type, id, cacheKey }, messageCache) {
  try {
    
    const idbData = await dbService.getMessages(cacheKey);
    const existingMessages = idbData?.messages ?? [];
    const latestTimestamp = idbData?.latestTimestamp ?? null;
    const existingHasMore = idbData?.hasMore ?? false;

    if (latestTimestamp && existingMessages.length > 0) {
      
      
      
      
      let mergedMessages = existingMessages;
      let cursor = latestTimestamp;
      let fetchedAnything = false;
      let keepGoing = true;
      let safety = 0;
      let lastRead = null;

      while (keepGoing && safety < 50) {
        safety += 1;

        const res = type === 'room'
          ? await messageService.getRoomMessages(id, 50, null, cursor)
          : await messageService.getPrivateMessages(id, 50, null, cursor);

        if (type === 'private') lastRead = res?.lastRead ?? lastRead;

        const newMessages = res?.messages ?? [];
        if (newMessages.length === 0) break;

        const existingIds = new Set(mergedMessages.map(m => String(m.id)));
        const reallyNew = newMessages.filter(m => !existingIds.has(String(m.id)));

        if (reallyNew.length) {
          mergedMessages = [...mergedMessages, ...reallyNew];
          cursor = reallyNew[reallyNew.length - 1].timestamp;
          fetchedAnything = true;
          await dbService.mergeNewMessages(cacheKey, reallyNew);
        }

        keepGoing = res?.hasMore ?? false;
      }

      if (type === 'private' && lastRead) {
        mergedMessages = applyLastRead(mergedMessages, lastRead);
      }

      const seenChanged = type === 'private' && lastRead && mergedMessages !== existingMessages;

      if (!fetchedAnything && !seenChanged) {
        
        if (!messageCache.current[cacheKey]) {
          messageCache.current[cacheKey] = {
            messages: existingMessages,
            hasMore: existingHasMore,
            timestamp: Date.now()
          };
        }
        return;
      }

      
      messageCache.current[cacheKey] = {
        messages: mergedMessages,
        hasMore: existingHasMore,
        timestamp: Date.now()
      };

    } else {
      
      const res = type === 'room'
        ? await messageService.getRoomMessages(id, 20)
        : await messageService.getPrivateMessages(id, 20);

      const fetchedMessages = res?.messages ?? [];
      const hasMore = res?.hasMore ?? false;

      if (fetchedMessages.length === 0) return;

      const finalMessages = type === 'private'
        ? applyLastRead(fetchedMessages, res?.lastRead)
        : fetchedMessages;

      await dbService.saveMessages(cacheKey, finalMessages, hasMore);

      messageCache.current[cacheKey] = {
        messages: finalMessages,
        hasMore,
        timestamp: Date.now()
      };
    }
  } catch (err) {
    
    console.warn(`[prefetch] ${cacheKey}:`, err?.message);
  }
}
