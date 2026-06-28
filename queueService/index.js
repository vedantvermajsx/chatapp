import dotenv from 'dotenv';
import BatchQueue from './BatchQueue.js';
import { processMessageBatch } from './processors/message/messageProcessor.js';
import { registerUserRegistrationHandler } from './processors/user/userRegistrationProcessor.js';
import { registerGuestRegistrationHandler } from './processors/guest/guestRegistrationProcessor.js';
import { registerRoomHandlers } from './processors/room/roomProcessor.js';
import { registerNotificationHandlers } from './processors/notification/notificationProcessor.js';
import { connectToBroker, subscribe, on } from './broker.js';
import { connectDB } from './database/db.js';
import { createAdminServer } from './adminServer.js';

dotenv.config();

const messageQueue = new BatchQueue({
  batchSize: 50,
  flushInterval: 500,
  processBatch: processMessageBatch,
});

async function start() {
  await connectDB();
  connectToBroker();

  subscribe('message.created');
  on('message.created', (messageData) => {
    messageQueue.add(messageData);
  });

  registerUserRegistrationHandler(subscribe, on);
  registerGuestRegistrationHandler(subscribe, on);
  registerRoomHandlers(subscribe, on);
  registerNotificationHandlers(subscribe, on);

  createAdminServer({
    port: process.env.PORT || 6000,
    getStats: () => messageQueue.getStats(),
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
