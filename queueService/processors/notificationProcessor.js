import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const cache = axios.create({
  baseURL: process.env.CACHE_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 3000
});

async function handleRoomUnread({ roomId, memberIds, senderId, activeViewerIds = [] }) {
  if (!roomId || !memberIds?.length) return;
  try {
    const skip = new Set([String(senderId), ...activeViewerIds.map(String)]);
    const targets = memberIds.map(String).filter(id => !skip.has(id));
    if (targets.length === 0) return;
    await cache.post('/unread/members/increment', {
      memberIds: targets,
      senderId,
      chatKey: `room_${roomId}`
    });
  } catch (err) {
    console.error('[NotificationProcessor] room unread increment error:', err.message);
  }
}

async function handlePrivateUnread({ receiverId, senderId }) {
  if (!receiverId || !senderId) return;
  try {
    await cache.post(`/unread/${receiverId}/increment`, {
      chatKey: `private_${senderId}`
    });
  } catch (err) {
    console.error('[NotificationProcessor] private unread increment error:', err.message);
  }
}

async function handleRoomLastRead({ userId, roomId, messageId, lastReadAt }) {
  if (!userId || !roomId) return;
  try {
    await cache.post(`/last-read/${userId}/room`, { roomId, messageId, lastReadAt });
  } catch (err) {
    console.error('[NotificationProcessor] room lastRead set error:', err.message);
  }
}

async function handlePrivateLastRead({ userId, peerId, messageId, lastSeenAt }) {
  if (!userId || !peerId) return;
  try {
    await cache.post(`/last-read/${userId}/private`, { peerId, messageId, lastSeenAt });
  } catch (err) {
    console.error('[NotificationProcessor] private lastRead set error:', err.message);
  }
}

async function handleRoomMsgCount({ roomId }) {
  if (!roomId) return;
  try {
    await cache.post(`/message-count/room/${roomId}/increment`);
  } catch (err) {
    console.error('[NotificationProcessor] room msgCount increment error:', err.message);
  }
}

async function handlePrivateMsgCount({ senderId, receiverId }) {
  if (!senderId || !receiverId) return;
  try {
    await cache.post('/message-count/private/increment', { senderId, receiverId });
  } catch (err) {
    console.error('[NotificationProcessor] private msgCount increment error:', err.message);
  }
}

export function registerNotificationHandlers(subscribe, on) {
  subscribe('notification.unread.room');
  on('notification.unread.room', handleRoomUnread);

  subscribe('notification.unread.private');
  on('notification.unread.private', handlePrivateUnread);

  subscribe('notification.lastread.room');
  on('notification.lastread.room', handleRoomLastRead);

  subscribe('notification.lastread.private');
  on('notification.lastread.private', handlePrivateLastRead);

  subscribe('notification.msgcount.room');
  on('notification.msgcount.room', handleRoomMsgCount);

  subscribe('notification.msgcount.private');
  on('notification.msgcount.private', handlePrivateMsgCount);

  console.log('[NotificationProcessor] subscribed to notification.* channels');
}
