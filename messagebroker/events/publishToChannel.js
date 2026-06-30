import { OutboundQueue } from '../utils/MessageQueue.js';

export default function publishToChannel(subscribers, channel, payload, publisherWs) {
  const clients = subscribers.get(channel);
  if (!clients || clients.size === 0) return;

  const message = JSON.stringify({ type: 'MESSAGE', channel, payload });

  for (const client of clients) {
    if (client === publisherWs) continue;
    if (client.readyState !== 1) continue;

    if (!client.outboundQueue) {
      client.outboundQueue = new OutboundQueue(client);
    }

    client.outboundQueue.enqueue(message);
  }
}
