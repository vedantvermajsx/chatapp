import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';
import { mergeOlder, MAX_MESSAGES } from '../../utils/messageList.js';
import { syncUnreadFromResponse } from '../../utils/syncUnreadCount.js';

export const loadMoreMessagesHandler = async (
  otherUser,
  user,
  messages,
  setMessages,
  setHasMoreMessages,
  loadingMoreMessages,
  messageCache,
  setUnreadCounts = null,
  isActive = () => true
) => {
  if (!messages || messages.length === 0 || loadingMoreMessages.current) return;
  loadingMoreMessages.current = true;

  try {
    const anchor = messages.find(m => !m.isPending);
    if (!anchor) return;
    const res = await messageService.getPrivateMessages(otherUser.id, 20, anchor.timestamp);

    const cacheKey = `private_${otherUser.id}`;
    const incoming = res.messages || [];
    const entry = messageCache?.current?.[cacheKey];
    const { messages: merged, dropped } = mergeOlder(entry?.messages ?? messages, incoming);
    const mergedRead = applyLastRead(merged, res.lastRead);
    const hasMore = !!res.hasMore || dropped > 0;

    if (messageCache?.current) {
      messageCache.current[cacheKey] = { messages: mergedRead, hasMore, timestamp: Date.now() };
    }
    if (isActive()) {
      setMessages((prev) => applyLastRead(mergeOlder(prev, incoming).messages, res.lastRead));
      setHasMoreMessages(hasMore);
    }
    const meta = await dbService.getChatMeta(cacheKey);
    if ((meta?.count ?? 0) < MAX_MESSAGES) {
      await dbService.mergeOlderMessages(cacheKey, incoming, hasMore);
    }

    syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);
  } catch (error) {
    console.error('Failed to load more messages:', error);
  } finally {
    loadingMoreMessages.current = false;
  }
};
