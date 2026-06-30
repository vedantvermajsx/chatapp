export default function removeSubscriberFromAllChannels(subscribers, ws) {
  for (const [channel, clients] of subscribers.entries()) {
    clients.delete(ws);
    if (clients.size === 0) {
      subscribers.delete(channel);
    }
  }
  if (ws.subscribedChannels) {
    ws.subscribedChannels.clear();
  }
}
