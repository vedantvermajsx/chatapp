import rateLimit from 'express-rate-limit';

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    message: 'Too many requests, please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, 
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS, 10) || 30 * 1000, 
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX, 10) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
