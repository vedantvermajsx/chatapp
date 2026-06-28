import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const CORE_CHANNELS = [
  'userOnline',
  'userOffline',
  'userJoinedRoom',
  'userLeftRoom',
  'newMessage',
  'newPrivateMessage',
  'newRoom',
  'roomUpdated',
  'roomDeleted',
  'webrtcSignal',
];

let ws = null;
let isOpen = false;
const messageHandlers = new Map();
const subscribedChannels = new Set();
const pendingOutbox = [];
const RECONNECT_DELAY_MS = 5000;

export function connectToBroker() {
  const MESSAGE_BROKER_URL = process.env.MESSAGE_BROKER_URL;
  console.log('message broker:', MESSAGE_BROKER_URL);

  ws = new WebSocket(MESSAGE_BROKER_URL);

  ws.on('open', () => {
    isOpen = true;
    console.log('Connected to Message Broker');

    CORE_CHANNELS.forEach((channel) => subscribedChannels.add(channel));
    subscribedChannels.forEach((channel) => sendRaw({ type: 'SUBSCRIBE', channel }));

    flushOutbox();
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
      console.error('Error parsing broker message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('Message Broker connection error:', error.message);
  });

  ws.on('close', () => {
    isOpen = false;
    console.log('Disconnected from Message Broker. Reconnecting in 5s...');
    setTimeout(connectToBroker, RECONNECT_DELAY_MS);
  });
}

function sendRaw(obj) {
  if (ws && isOpen) {
    ws.send(JSON.stringify(obj));
    return true;
  }
  return false;
}

function flushOutbox() {
  while (pendingOutbox.length > 0) {
    const msg = pendingOutbox.shift();
    if (!sendRaw(msg)) {
      pendingOutbox.unshift(msg);
      break;
    }
  }
}

export function subscribe(channel) {
  if (subscribedChannels.has(channel)) return;
  subscribedChannels.add(channel);
  sendRaw({ type: 'SUBSCRIBE', channel });
}

export function unsubscribe(channel) {
  subscribedChannels.delete(channel);
  sendRaw({ type: 'UNSUBSCRIBE', channel });
}

export function publish(channel, payload) {
  const msg = { type: 'PUBLISH', channel, payload };
  if (!sendRaw(msg)) {
    pendingOutbox.push(msg);
  }
}

export function on(channel, handler) {
  if (!messageHandlers.has(channel)) {
    messageHandlers.set(channel, new Set());
    subscribe(channel);
  }
  messageHandlers.get(channel).add(handler);
}

export function off(channel, handler) {
  if (messageHandlers.has(channel)) {
    messageHandlers.get(channel).delete(handler);
    if (messageHandlers.get(channel).size === 0) {
      messageHandlers.delete(channel);
    }
  }
}
