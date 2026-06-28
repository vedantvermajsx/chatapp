import UnreadCount from '../../models/UnreadCount.model.js';

export async function handlePrivateUnread({ receiverId, senderId }) {
  if (!receiverId || !senderId) return;

  try {
    await UnreadCount.increment(senderId, 'User', receiverId, 'User');
  } catch (err) {
    console.error('[NotificationProcessor] private unread increment error:', err.message);
  }
}
