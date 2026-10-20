import rateLimit from 'express-rate-limit';
import { rateLimitKey } from '../../utils/clientIp.js';

export const DEFAULT_CHESS_RATE_LIMIT_MAX = 200;
export const DEFAULT_CHESS_RATE_LIMIT_WINDOW_MS = 60 * 1000;

export const createChessLimiter = () =>
  rateLimit({
    windowMs: parseInt(process.env.CHESS_RATE_LIMIT_WINDOW_MS, 10) || DEFAULT_CHESS_RATE_LIMIT_WINDOW_MS,
    limit: parseInt(process.env.CHESS_RATE_LIMIT_MAX, 10) || DEFAULT_CHESS_RATE_LIMIT_MAX,
    keyGenerator: rateLimitKey,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        message: 'Too many chess requests, please slow down.',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  });
