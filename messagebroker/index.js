import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import subscribeToChannel from './events/subscribeToChannel.js';
import unsubscribeFromChannel from './events/unsubscribeFromChannel.js';
import publishToChannel from './events/publishToChannel.js';
import removeSubscriberFromAllChannels from './events/removeSubscriberFromAllChannels.js';
import { verifyWsMessage } from './utils/hmacVerify.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MAX_CONNECTIONS_PER_IP = parseInt(process.env.MAX_CONNECTIONS_PER_IP, 10) || 10;

const wss = new WebSocketServer({ port: PORT });

const subscribers = new Map();


const ipConnectionCount = new Map();

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  );
}

console.log(`Message Broker Service started on port ${PORT}`);

wss.on('connection', (ws, req) => {
  const clientIp = getClientIp(req);
  const currentCount = ipConnectionCount.get(clientIp) || 0;

  if (currentCount >= MAX_CONNECTIONS_PER_IP) {
    console.warn(
      `[MessageBroker] Rate limit: IP ${clientIp} exceeded max connections (${MAX_CONNECTIONS_PER_IP}), terminating.`
    );
    ws.close(1008, 'Too many connections from your IP');
    return;
  }

  ipConnectionCount.set(clientIp, currentCount + 1);
  ws.clientIp = clientIp;
  ws.isAlive = true;

  console.log(`Client connected to message broker [${clientIp}] (${currentCount + 1}/${MAX_CONNECTIONS_PER_IP})`);

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

    const { valid, reason } = verifyWsMessage(data);
    if (!valid) {
      console.warn(`[MessageBroker] Invalid message from [${ws.clientIp}]: ${reason}. Discarding.`);
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
    const remaining = (ipConnectionCount.get(ws.clientIp) || 1) - 1;
    if (remaining <= 0) {
      ipConnectionCount.delete(ws.clientIp);
    } else {
      ipConnectionCount.set(ws.clientIp, remaining);
    }
    console.log(`Client disconnected from message broker [${ws.clientIp}]`);
    removeSubscriberFromAllChannels(subscribers, ws);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error [${ws.clientIp}]:`, error.message);
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

