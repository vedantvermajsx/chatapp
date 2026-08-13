import crypto from 'crypto';

function requireSecret() {
  const secret = process.env.HMAC_SECRET;
  if (!secret) throw new Error('[hmacClient] HMAC_SECRET env var is not set');
  return secret;
}

export function signWsMessage(msgObj) {
  const HMAC_SECRET = requireSecret();
  const SERVICE_ID = process.env.SERVICE_ID || 'cacheservice';
  const timestamp = Date.now().toString();
  const payloadStr = msgObj.payload !== undefined ? JSON.stringify(msgObj.payload) : '';
  const signingString = `${msgObj.type}\n${msgObj.channel || ''}\n${timestamp}\n${payloadStr}`;
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(signingString, 'utf8')
    .digest('hex');

  return { ...msgObj, serviceId: SERVICE_ID, timestamp, signature };
}
