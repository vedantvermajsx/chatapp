export default function unsubscribeFromChannel(subscribers, channel, ws) {
  const clients = subscribers.get(channel);
  if (!clients) return;
  clients.delete(ws);
  if (clients.size === 0) {
    subscribers.delete(channel);
  }
}
