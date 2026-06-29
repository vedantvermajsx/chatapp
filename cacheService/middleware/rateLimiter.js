import rateLimit from 'express-rate-limit';

export const internalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Too many requests to cache service.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});
