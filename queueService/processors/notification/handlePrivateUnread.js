import UnreadCount from '../../models/UnreadCount.model.js';

// A new (non-system) private message was sent: bump the sender->receiver totalCount.
export async function handlePrivateUnread({ receiverId, senderId }) {
  if (!receiverId || !senderId) return;

  try {
    await UnreadCount.incrementTotal(String(senderId), String(receiverId));
  } catch (err) {
    console.error('[NotificationProcessor] private unread increment error:', err.message);
    throw err; // BatchQueue retries; swallowing would permanently under-count
  }
}
