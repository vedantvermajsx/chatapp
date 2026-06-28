import UnreadCount from '../../models/UnreadCount.model.js';

export async function handleRoomUnread({ roomId, memberIds, senderId, activeViewerIds = [] }) {
  if (!roomId || !memberIds?.length) return;

  const skip = new Set([String(senderId), ...activeViewerIds.map(String)]);
  const targets = memberIds.map(String).filter((id) => !skip.has(id));
  if (targets.length === 0) return;

  try {
    await Promise.all(
      targets.map((receiverId) =>
        UnreadCount.increment(roomId, 'Room', receiverId, 'User')
      )
    );
  } catch (err) {
    console.error('[NotificationProcessor] room unread increment error:', err.message);
  }
}
