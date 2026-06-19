// Queue Service

import dotenv from 'dotenv';
import BatchQueue from './BatchQueue.js';
import { processMessageBatch } from './processors/messageProcessor.js';
import { connectToBroker, subscribe, on } from './broker.js';
import { connectDB } from './database/db.js';
import Message from './models/message.model.js';
import { invalidateMessageCache } from './cacheClient.js';
import { createAdminServer } from './adminServer.js';

dotenv.config();

const messageQueue = new BatchQueue({
  batchSize: 50,
  flushInterval: 500,
  processBatch: processMessageBatch
});

async function start() {
  await connectDB();
  connectToBroker();

  subscribe('message.created');
  on('message.created', (messageData) => {
    messageQueue.add(messageData);
  });

  subscribe('room.deleted');
  on('room.deleted', async ({ roomId }) => {
    try {
      const { deletedCount } = await Message.deleteMany({ roomId });
      console.log(`[QueueService] deleted ${deletedCount} message(s) for removed room ${roomId}`);
    } catch (err) {
      console.error(`[QueueService] failed to delete messages for room ${roomId}:`, err.message);
    } finally {
      await invalidateMessageCache({ roomId });
    }
  });

  createAdminServer({
    port: process.env.PORT || 6000,
    getStats: () => messageQueue.getStats()
  });

  console.log('[QueueService] ready — subscribed to: message.created, room.deleted');
}

start().catch((err) => {
  console.error('[QueueService] failed to start:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('[QueueService] shutting down');
  process.exit(0);
});