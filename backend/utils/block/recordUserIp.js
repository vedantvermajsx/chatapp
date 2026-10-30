import { getClientIp } from '../clientIp.js';
import { enqueueUserIp } from '../queueClient.js';

export function recordUserIp(req, userId, username) {
  const ip = getClientIp(req);
  if (!ip) return;
  enqueueUserIp({ ip, userId: String(userId), username });
}
