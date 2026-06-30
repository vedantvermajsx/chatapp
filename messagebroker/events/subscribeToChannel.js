const DEFAULT_MAX_SUBSCRIPTIONS_PER_CONNECTION = 1000;

export default function subscribeToChannel(subscribers, channel, ws, options = {}) {
  const maxSubscriptions = options.maxSubscriptions || DEFAULT_MAX_SUBSCRIPTIONS_PER_CONNECTION;

  if (!ws.subscribedChannels) {
    ws.subscribedChannels = new Set();
  }
  if (ws.subscribedChannels.has(channel)) return;

  if (ws.subscribedChannels.size >= maxSubscriptions) {
    console.warn(
      `[MessageBroker] [${ws.clientIp}] hit subscription limit (${maxSubscriptions}), ignoring SUBSCRIBE for "${channel}"`
    );
    return;
  }

  if (!subscribers.has(channel)) {
    subscribers.set(channel, new Set());
  }
  subscribers.get(channel).add(ws);
  ws.subscribedChannels.add(channel);
}