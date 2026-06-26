import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';

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
      const res = type === 'room'
        ? await messageService.getRoomMessages(id, 50, null, latestTimestamp)
        : await messageService.getPrivateMessages(id, 50, null, latestTimestamp);

      const newMessages = res?.messages ?? [];

      if (newMessages.length === 0) {
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

      // Deduplicate (socket may have already written some)
      const existingIds = new Set(existingMessages.map(m => String(m.id)));
      const reallyNew = newMessages.filter(m => !existingIds.has(String(m.id)));

      if (reallyNew.length === 0) {
        if (!messageCache.current[cacheKey]) {
          messageCache.current[cacheKey] = {
            messages: existingMessages,
            hasMore: existingHasMore,
            timestamp: Date.now()
          };
        }
        return;
      }

      // Append new messages after existing ones
      const merged = [...existingMessages, ...reallyNew];

      // Persist to IDB
      await dbService.mergeNewMessages(cacheKey, reallyNew);

      // Write to in-memory cache
      messageCache.current[cacheKey] = {
        messages: merged,
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

      await dbService.saveMessages(cacheKey, fetchedMessages, hasMore);

      messageCache.current[cacheKey] = {
        messages: fetchedMessages,
        hasMore,
        timestamp: Date.now()
      };
    }
  } catch (err) {
    // Non-fatal — user will still see messages when they open the chat
    console.warn(`[prefetch] ${cacheKey}:`, err?.message);
  }
}
