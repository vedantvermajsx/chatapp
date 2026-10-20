import rateLimit from 'express-rate-limit';
import { rateLimitKey } from '../utils/clientIp.js';

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    message: 'Too many requests, please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  keyGenerator: rateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 5 * 60 * 1000, 
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  keyGenerator: rateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const messagingLimiter = rateLimit({
  windowMs: parseInt(process.env.MESSAGE_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000, 
  max: parseInt(process.env.MESSAGE_RATE_LIMIT_MAX, 10) || 100,
  keyGenerator: rateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many messaging requests, please slow down.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

export const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS, 10) || 30 * 1000, 
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX, 10) || 10,
  keyGenerator: rateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Slow down, you are uploading a lot of files.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});
