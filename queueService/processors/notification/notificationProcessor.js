import { handlePrivateUnread } from './handlePrivateUnread.js';
import { handleRoomLastRead } from './handleRoomLastRead.js';
import { handlePrivateLastRead } from './handlePrivateLastRead.js';

export function registerNotificationHandlers(subscribe, on) {
  subscribe('notification.unread.private');
  on('notification.unread.private', handlePrivateUnread);

  subscribe('notification.lastread.room');
  on('notification.lastread.room', handleRoomLastRead);

  subscribe('notification.lastread.private');
  on('notification.lastread.private', handlePrivateLastRead);

  console.log('[NotificationProcessor] subscribed to notification.* channels');
}
