export default function unsubscribeFromChannel(subscribers, channel, ws) {
  if (ws.subscribedChannels) {
    ws.subscribedChannels.delete(channel);
  }

  const clients = subscribers.get(channel);
  if (!clients) return;
  clients.delete(ws);
  if (clients.size === 0) {
    subscribers.delete(channel);
  }
}
