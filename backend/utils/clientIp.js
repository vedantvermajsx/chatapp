import { ipKeyGenerator } from 'express-rate-limit';

export const getClientIp = (req) => {
  const secret = process.env.LB_SECRET;
  const forwarded = req.get('x-client-ip');
  if (secret && forwarded && req.get('x-lb-secret') === secret) {
    return forwarded.trim();
  }
  return req.ip;
};

export const rateLimitKey = (req) => ipKeyGenerator(getClientIp(req) || '0.0.0.0');
