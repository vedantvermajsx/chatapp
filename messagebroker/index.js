import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import removeSubscriberFromAllChannels from './events/removeSubscriberFromAllChannels.js';
import processMessage from "./utils/processMessage.js";
import { InboundQueue } from './utils/MessageQueue.js';
import getClientIp from './utils/getClientIp.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MAX_CONNECTIONS_PER_IP = parseInt(process.env.MAX_CONNECTIONS_PER_IP, 10) || 10;
const INBOUND_TOKENS_PER_INTERVAL = parseInt(process.env.INBOUND_TOKENS_PER_INTERVAL, 10) || 20;
const INBOUND_INTERVAL_MS = parseInt(process.env.INBOUND_INTERVAL_MS, 10) || 1000;
const INBOUND_MAX_QUEUE_SIZE = process.env.INBOUND_MAX_QUEUE_SIZE
  ? parseInt(process.env.INBOUND_MAX_QUEUE_SIZE, 10)
  : 10000;
const MAX_PAYLOAD_BYTES = parseInt(process.env.MAX_PAYLOAD_BYTES, 10) || 2 * 1024 * 1024; 
const MAX_BUFFER_SIZE = parseInt(process.env.MAX_BUFFER_SIZE, 10) || 4 * 1024 * 1024;

const subscribers = new Map();
const ipConnectionCount = new Map();


const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      connections: wss.clients.size,
      subscribedChannels: subscribers.size
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const wss = new WebSocketServer({
  server,
  maxPayload: MAX_PAYLOAD_BYTES
});



server.listen(PORT, () => {
  console.log(`Message Broker Service started on port ${PORT} (HTTP /health + WS)`);
});

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

  ws.inboundQueue = new InboundQueue(
    ws,
    (rawMessage) => processMessage(ws, rawMessage),
    {
      tokensPerInterval: INBOUND_TOKENS_PER_INTERVAL,
      intervalMs: INBOUND_INTERVAL_MS,
      maxQueueSize: INBOUND_MAX_QUEUE_SIZE
    }
  );

  ws.on('message', (message) => {
    ws.inboundQueue.enqueue(message);
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

    if (ws.inboundQueue) ws.inboundQueue.destroy();
    if (ws.outboundQueue) ws.outboundQueue.destroy();
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error [${ws.clientIp}]:`, error.message);
  });
});


const HEARTBEAT_INTERVAL = 30000;
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      console.warn(`[MessageBroker] [${ws.clientIp}] failed heartbeat, terminating`);
      ws.terminate();
      continue;
    }

    if (ws.bufferedAmount > MAX_BUFFER_SIZE) {
      console.warn(
        `[MessageBroker] [${ws.clientIp}] bufferedAmount (${ws.bufferedAmount}) exceeded ${MAX_BUFFER_SIZE}, terminating`
      );
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

  for (const ws of wss.clients) {
    ws.close(1001, 'Server shutting down');
  }

  wss.close(() => server.close(() => process.exit(0)));
});