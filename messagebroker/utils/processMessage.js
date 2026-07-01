import subscribeToChannel from "../events/subscribeToChannel.js";
import unsubscribeFromChannel from "../events/unsubscribeFromChannel.js";
import publishToChannel from "../events/publishToChannel.js";
import { verifyWsMessage } from "./hmacVerify.js";
import { subscribers } from "../index.js";

const MAX_SUBSCRIPTIONS_PER_CONNECTION = 1000;

function processMessage(ws, message) {
  let data;
  try {
    data = JSON.parse(message);
  } catch (error) {
    console.error('Error parsing message:', error);
    return;
  }

  const { valid, reason } = verifyWsMessage(data);
  if (!valid) {
    console.warn(`[MessageBroker] Invalid message from [${ws.clientIp}]: ${reason}. Discarding.`);
    return;
  }

  switch (data.type) {
    case 'SUBSCRIBE':
      subscribeToChannel(subscribers, data.channel, ws, {
        maxSubscriptions: MAX_SUBSCRIPTIONS_PER_CONNECTION
      });
      break;
    case 'UNSUBSCRIBE':
      unsubscribeFromChannel(subscribers, data.channel, ws);
      break;
    case 'PUBLISH':
      publishToChannel(subscribers, data.channel, data.payload, ws);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

export default processMessage;