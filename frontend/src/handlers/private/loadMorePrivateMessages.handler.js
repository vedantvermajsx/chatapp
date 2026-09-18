import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';
import { syncUnreadFromResponse } from '../../utils/syncUnreadCount.js';

export const loadMoreMessagesHandler = async (
  otherUser,
  user,
  messages,
  setMessages,
  setHasMoreMessages,
  loadingMoreMessages,
  messageCache,
  setUnreadCounts = null
) => {
  if (!messages || messages.length === 0 || loadingMoreMessages.current) return;
  loadingMoreMessages.current = true;

  try {
    const earliestTimestamp = messages[0].timestamp;
    const res = await messageService.getPrivateMessages(otherUser.id, 20, earliestTimestamp);

    // Same boundary-duplicate guard used everywhere else messages get
    // merged in this app — avoids re-adding the cursor message itself
    // (or siblings sharing its exact timestamp) a second time.
    const existingIds = new Set(messages.map(m => String(m.id || m._id)));
    const reallyOlder = (res.messages || []).filter(m => !existingIds.has(String(m.id || m._id)));

    const merged = applyLastRead([...reallyOlder, ...messages], res.lastRead);
    setMessages(merged);
    setHasMoreMessages(res.hasMore);

    // Persist the merged window, not just component state — otherwise
    // the older messages a user just scrolled up to see vanish again
    // the moment the in-memory/IndexedDB cache is restored (chat
    // switch, refresh, etc.).
    const cacheKey = `private_${otherUser.id}`;
    if (messageCache?.current) {
      messageCache.current[cacheKey] = {
        messages: merged,
        hasMore: res.hasMore,
        timestamp: Date.now(),
      };
    }
    await dbService.saveMessages(cacheKey, merged, res.hasMore);

    syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);
  } catch (error) {
    console.error('Failed to load more messages:', error);
  } finally {
    loadingMoreMessages.current = false;
  }
};
