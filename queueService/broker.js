import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

let ws = null;
let isOpen = false;
const messageHandlers = new Map();
const subscribedChannels = new Set();
const RECONNECT_DELAY_MS = 5000;

export function connectToBroker() {
  const MESSAGE_BROKER_URL = process.env.MESSAGE_BROKER_URL;
  console.log('[QueueService] connecting to message broker:', MESSAGE_BROKER_URL);

  ws = new WebSocket(MESSAGE_BROKER_URL);

  ws.on('open', () => {
    isOpen = true;
    console.log('[QueueService] connected to message broker');
    subscribedChannels.forEach((channel) =>
      ws.send(JSON.stringify({ type: 'SUBSCRIBE', channel }))
    );
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type === 'MESSAGE') {
        const handlers = messageHandlers.get(message.channel);
        if (handlers) {
          handlers.forEach((handler) => handler(message.payload));
        }
      }
    } catch (error) {
      console.error('[QueueService] error parsing broker message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('[QueueService] message broker connection error:', error.message);
  });

  ws.on('close', () => {
    isOpen = false;
    console.log('[QueueService] disconnected from message broker. Reconnecting in 5s...');
    setTimeout(connectToBroker, RECONNECT_DELAY_MS);
  });
}

export function subscribe(channel) {
  subscribedChannels.add(channel);
  if (ws && isOpen) {
    ws.send(JSON.stringify({ type: 'SUBSCRIBE', channel }));
  }
}

export function on(channel, handler) {
  if (!messageHandlers.has(channel)) {
    messageHandlers.set(channel, new Set());
  }
  messageHandlers.get(channel).add(handler);
}
