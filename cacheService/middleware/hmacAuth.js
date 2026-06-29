import crypto from 'crypto';

const TIMESTAMP_TOLERANCE_MS = 30 * 1000; 

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

export function hmacAuth(req, res, next) {
  if (req.path === '/health') return next();

  const HMAC_SECRET = process.env.HMAC_SECRET;
  if (!HMAC_SECRET) {
    console.error('[CacheService] HMAC_SECRET is not configured — refusing request');
    return res.status(503).json({ message: 'Service misconfigured' });
  }

  const serviceId = req.headers['x-service-id'];
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];

  if (!serviceId || !timestamp || !signature) {
    return res.status(401).json({ message: 'Unauthorized: missing HMAC headers' });
  }

  
  const requestTime = parseInt(timestamp, 10);
  if (Number.isNaN(requestTime) || Math.abs(Date.now() - requestTime) > TIMESTAMP_TOLERANCE_MS) {
    return res.status(401).json({ message: 'Unauthorized: stale or invalid timestamp' });
  }

  
  const rawBody = req.rawBody || '';
  const bodyHash = sha256(rawBody);
  // Use the full path (no query string) so it matches what the client resolved
  const urlPath = req.originalUrl.split('?')[0];
  const signingString = `${req.method}\n${urlPath}\n${timestamp}\n${bodyHash}`;

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
      console.warn(`[CacheService] HMAC mismatch from service="${serviceId}" path="${urlPath}"`);
      return res.status(401).json({ message: 'Unauthorized: invalid signature' });
    }
  } catch {
    return res.status(401).json({ message: 'Unauthorized: malformed signature' });
  }

  next();
}
