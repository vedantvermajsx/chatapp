import crypto from 'crypto';

const TIMESTAMP_TOLERANCE_MS = 30 * 1000; // ±30s

export function verifyWsMessage(msgObj) {
  // Read lazily so dotenv.config() in the entry point has time to run first.
  // (ESM imports are hoisted, so module-level reads happen before dotenv loads.)
  const HMAC_SECRET = process.env.HMAC_SECRET;
  if (!HMAC_SECRET) {
    return { valid: false, reason: 'HMAC_SECRET not configured on broker' };
  }

  const { serviceId, timestamp, signature, type, channel, payload } = msgObj;

  if (!serviceId || !timestamp || !signature) {
    return { valid: false, reason: 'Missing HMAC fields' };
  }

  const reqTime = parseInt(timestamp, 10);
  if (Number.isNaN(reqTime) || Math.abs(Date.now() - reqTime) > TIMESTAMP_TOLERANCE_MS) {
    return { valid: false, reason: 'Stale timestamp (replay protection)' };
  }

  const payloadStr = payload !== undefined ? JSON.stringify(payload) : '';
  const signingString = `${type}\n${channel || ''}\n${timestamp}\n${payloadStr}`;

  const expected = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(signingString, 'utf8')
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(signature, 'hex');

    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      return { valid: false, reason: 'Invalid signature' };
    }
  } catch {
    return { valid: false, reason: 'Malformed signature' };
  }

  return { valid: true };
}
