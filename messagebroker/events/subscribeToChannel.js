export default function subscribeToChannel(subscribers, channel, ws) {
  if (!subscribers.has(channel)) {
    subscribers.set(channel, new Set());
  }
  subscribers.get(channel).add(ws);
  console.log(`[${ws.clientId}] subscribed to channel: ${channel}`);
}