import rateLimit from 'express-rate-limit';
import { rateLimitKey } from '../../utils/clientIp.js';

export const DEFAULT_MINIGAMES_RATE_LIMIT_MAX = 200;
export const DEFAULT_MINIGAMES_RATE_LIMIT_WINDOW_MS = 60 * 1000;

export const createMinigamesLimiter = () =>
  rateLimit({
    windowMs: parseInt(process.env.MINIGAMES_RATE_LIMIT_WINDOW_MS, 10) || DEFAULT_MINIGAMES_RATE_LIMIT_WINDOW_MS,
    limit: parseInt(process.env.MINIGAMES_RATE_LIMIT_MAX, 10) || DEFAULT_MINIGAMES_RATE_LIMIT_MAX,
    keyGenerator: rateLimitKey,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        message: 'Too many minigame requests, please slow down.',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  });
