import messageService from '../../services/message.service.js';

export const loadMoreRoomMessagesHandler = async (
  roomId,
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
    const res = await messageService.getRoomMessages(roomId, 20, earliestTimestamp);

    const merged = [...res.messages, ...messages];
    setMessages(merged);
    setHasMoreMessages(res.hasMore);
  } catch (error) {
    console.error('Failed to load more room messages:', error);
  } finally {
    loadingMoreMessages.current = false;
  }
};
