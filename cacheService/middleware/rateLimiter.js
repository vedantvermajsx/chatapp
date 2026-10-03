import rateLimit from 'express-rate-limit';

export const internalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000, 
  max:50000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[CacheService] RATE LIMITED ${req.method} ${req.originalUrl} - cache updates are being rejected; raise RATE_LIMIT_MAX`);
    res.status(429).json({
      message: 'Too many requests to cache service.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});
