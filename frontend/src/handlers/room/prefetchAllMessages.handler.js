import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';

/**
 * On app open: for every joined room and private chat, fetch only the messages
 * that arrived AFTER the last message we already have cached in IDB.
 *
 * - If IDB has messages  → fetch after=latestTimestamp (delta of new messages)
 * - If IDB is cold       → fetch latest 20 messages fresh
 *
 * All results are merged into IDB + messageCache so when the user taps any
 * chat it shows instantly with all new messages already appended at the bottom.
 *
 * Runs fully in the background — no loading state, no UI blocking.
 */
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

  // Process in batches to avoid hammering the server
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const batch = tasks.slice(i, i + CONCURRENCY);
    await Promise.allSettled(batch.map(task => _prefetchChat(task, messageCache)));
  }
};

async function _prefetchChat({ type, id, cacheKey }, messageCache) {
  try {
    // 1. Read what we already have stored in IDB
    const idbData = await dbService.getMessages(cacheKey);
    const existingMessages = idbData?.messages ?? [];
    const latestTimestamp = idbData?.latestTimestamp ?? null;
    const existingHasMore = idbData?.hasMore ?? false;

    if (latestTimestamp && existingMessages.length > 0) {
      // ── DELTA FETCH: get only messages AFTER our latest cached message ──
      // Loop in case more than one page's worth of messages arrived while
      // we were offline — a single fetch would otherwise silently drop the
      // remainder, since there's no scroll-triggered "load newer" path.
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
        // Nothing new — just warm the in-memory cache from IDB
        if (!messageCache.current[cacheKey]) {
          messageCache.current[cacheKey] = {
            messages: existingMessages,
            hasMore: existingHasMore,
            timestamp: Date.now()
          };
        }
        return;
      }

      // Write to in-memory cache
      messageCache.current[cacheKey] = {
        messages: mergedMessages,
        hasMore: existingHasMore,
        timestamp: Date.now()
      };

    } else {
      // ── COLD CACHE: no local data at all — fetch latest 20 messages ──
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
    // Non-fatal — user will still see messages when they open the chat
    console.warn(`[prefetch] ${cacheKey}:`, err?.message);
  }
}
