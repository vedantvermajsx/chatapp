import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import subscribeToChannel from './events/subscribeToChannel.js';
import unsubscribeFromChannel from './events/unsubscribeFromChannel.js';
import publishToChannel from './events/publishToChannel.js';
import removeSubscriberFromAllChannels from './events/removeSubscriberFromAllChannels.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

const wss = new WebSocketServer({ port: PORT });

const subscribers = new Map();

console.log(`Message Broker Service started on port ${PORT}`);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  console.log(`Client connected to message broker`);

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error('Error parsing message:', error);
      return;
    }

    switch (data.type) {
      case 'SUBSCRIBE':
        subscribeToChannel(subscribers, data.channel, ws);
        break;
      case 'UNSUBSCRIBE':
        unsubscribeFromChannel(subscribers, data.channel, ws);
        break;
      case 'PUBLISH':
        publishToChannel(subscribers, data.channel, data.payload, ws);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected from message broker [${ws.clientId}]`);
    removeSubscriberFromAllChannels(subscribers, ws);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error [${ws.clientId}]:`, error.message);
  });
});



const HEARTBEAT_INTERVAL = 30000;
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
   }
}, HEARTBEAT_INTERVAL);

wss.on('close', () => clearInterval(heartbeat));

process.on('SIGTERM', () => {
  console.log('Message broker shutting down');
  clearInterval(heartbeat);
  wss.close(() => process.exit(0));
});
