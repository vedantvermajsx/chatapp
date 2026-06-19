
// BACKEND [publish]  -- > queue [CONSUMES]
import { publish } from './messageBroker.js';

export function enqueueMessage(messageData) {
  publish('message.created', messageData);
}
