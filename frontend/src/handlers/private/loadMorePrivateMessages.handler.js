import messageService from '../../services/message.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';

export const loadMoreMessagesHandler = async (
  otherUser,
  user,
  messages,
  setMessages,
  setHasMoreMessages,
  loadingMoreMessages,
  messageCache
) => {
  if (!messages || messages.length === 0 || loadingMoreMessages.current) return;
  loadingMoreMessages.current = true;

  try {
    const earliestTimestamp = messages[0].timestamp;
    const res = await messageService.getPrivateMessages(otherUser.id, 20, earliestTimestamp);

    const merged = applyLastRead([...res.messages, ...messages], res.lastRead);
    setMessages(merged);
    setHasMoreMessages(res.hasMore);
  } catch (error) {
    console.error('Failed to load more messages:', error);
  } finally {
    loadingMoreMessages.current = false;
  }
};
