import dotenv from 'dotenv';
import BatchQueue from './BatchQueue.js';
import { processMessageBatch } from './processors/message/messageProcessor.js';
import { handleUserRegistered } from './processors/user/userRegistrationProcessor.js';
import { handleGuestRegistered } from './processors/guest/guestRegistrationProcessor.js';
import { handleRoomCreated } from './processors/room/handleRoomCreated.js';
import { handleMemberJoined } from './processors/room/handleMemberJoined.js';
import { handleMemberLeft } from './processors/room/handleMemberLeft.js';
import { handleRoomDeleted } from './processors/room/handleRoomDeleted.js';
import { handleRoomUnread } from './processors/notification/handleRoomUnread.js';
import { handlePrivateUnread } from './processors/notification/handlePrivateUnread.js';
import { handleRoomLastRead } from './processors/notification/handleRoomLastRead.js';
import { handlePrivateLastRead } from './processors/notification/handlePrivateLastRead.js';
import { connectToBroker, subscribe, on } from './broker.js';
import { connectDB } from './database/db.js';
import { createAdminServer } from './adminServer.js';

dotenv.config();

const messageQueue = new BatchQueue({
  batchSize: 50,
  flushInterval: 500,
  maxSize: 30000,
  processBatch: processMessageBatch,
});

const userQueue = new BatchQueue({
  batchSize: 1,
  flushInterval: 100,
  maxSize: 10000,
  processBatch: ([item]) => handleUserRegistered(item),
});

const guestQueue = new BatchQueue({
  batchSize: 1,
  flushInterval: 100,
  maxSize: 10000,
  processBatch: ([item]) => handleGuestRegistered(item),
});

const roomQueue = new BatchQueue({
  batchSize: 1,
  flushInterval: 100,
  maxSize: 10000,
  processBatch: async ([item]) => {
    const { _eventType, ...payload } = item;
    if (_eventType === 'room.created') return handleRoomCreated(payload);
    if (_eventType === 'room.member.joined') return handleMemberJoined(payload);
    if (_eventType === 'room.member.left') return handleMemberLeft(payload);
    if (_eventType === 'room.deleted') return handleRoomDeleted(payload);
  },
});

const notificationQueue = new BatchQueue({
  batchSize: 1,
  flushInterval: 100,
  maxSize: 10000,
  processBatch: async ([item]) => {
    const { _eventType, ...payload } = item;
    if (_eventType === 'notification.unread.room') return handleRoomUnread(payload);
    if (_eventType === 'notification.unread.private') return handlePrivateUnread(payload);
    if (_eventType === 'notification.lastread.room') return handleRoomLastRead(payload);
    if (_eventType === 'notification.lastread.private') return handlePrivateLastRead(payload);
  },
});

async function start() {
  await connectDB();
  connectToBroker();

  subscribe('message.created');
  on('message.created', (data) => messageQueue.add(data));

  subscribe('user.registered');
  on('user.registered', (data) => userQueue.add(data));
  console.log('[UserRegistrationProcessor] subscribed to user.registered');

  subscribe('guest.registered');
  on('guest.registered', (data) => guestQueue.add(data));
  console.log('[GuestRegistrationProcessor] subscribed to guest.registered');

  subscribe('room.created');
  on('room.created', (data) => roomQueue.add({ _eventType: 'room.created', ...data }));

  subscribe('room.member.joined');
  on('room.member.joined', (data) => roomQueue.add({ _eventType: 'room.member.joined', ...data }));

  subscribe('room.member.left');
  on('room.member.left', (data) => roomQueue.add({ _eventType: 'room.member.left', ...data }));

  subscribe('room.deleted');
  on('room.deleted', (data) => roomQueue.add({ _eventType: 'room.deleted', ...data }));

  console.log('[RoomProcessor] subscribed to room.created, room.member.joined, room.member.left, room.deleted');

  subscribe('notification.unread.room');
  on('notification.unread.room', (data) => notificationQueue.add({ _eventType: 'notification.unread.room', ...data }));

  subscribe('notification.unread.private');
  on('notification.unread.private', (data) => notificationQueue.add({ _eventType: 'notification.unread.private', ...data }));

  subscribe('notification.lastread.room');
  on('notification.lastread.room', (data) => notificationQueue.add({ _eventType: 'notification.lastread.room', ...data }));

  subscribe('notification.lastread.private');
  on('notification.lastread.private', (data) => notificationQueue.add({ _eventType: 'notification.lastread.private', ...data }));

  console.log('[NotificationProcessor] subscribed to notification.* channels');

  createAdminServer({
    port: process.env.PORT || 6000,
    getStats: () => ({
      messageQueue: messageQueue.getStats(),
      userQueue: userQueue.getStats(),
      guestQueue: guestQueue.getStats(),
      roomQueue: roomQueue.getStats(),
      notificationQueue: notificationQueue.getStats(),
    }),
  });

  console.log(
    '[QueueService] ready — subscribed to: ' +
    'message.created, room.deleted, ' +
    'user.registered, guest.registered, ' +
    'room.created, room.member.joined, room.member.left, ' +
    'notification.unread.*, notification.lastread.*'
  );
}

start().catch((err) => {
  console.error('[QueueService] failed to start:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('[QueueService] shutting down');
  process.exit(0);
});
