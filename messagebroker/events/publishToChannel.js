import { OutboundQueue } from '../utils/MessageQueue.js';

export default function publishToChannel(subscribers, channel, payload, publisherWs) {
  const clients = subscribers.get(channel);
  if (!clients || clients.size === 0) return;

  const message = JSON.stringify({ type: 'MESSAGE', channel, payload });

  for (const client of clients) {
    if (client === publisherWs) continue;
    if (client.readyState !== 1) continue;

    // Lazily attach a per-connection outbound queue. This decouples the
    // fan-out loop from any single slow consumer: instead of calling
    // client.send() directly (which can pile up unbounded data in the
    // underlying socket buffer for a slow client), messages are queued
    // and drained as fast as that client's connection can absorb them.
    if (!client.outboundQueue) {
      client.outboundQueue = new OutboundQueue(client);
    }

    client.outboundQueue.enqueue(message);
  }
}
