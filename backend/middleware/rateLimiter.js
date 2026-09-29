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
  // Login/signup: a real user doesn't retry these in quick succession, so
  // a short window with a low cap is fine and blunts credential-stuffing/
  // signup-spam attempts.
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 5 * 60 * 1000, 
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const messagingLimiter = rateLimit({
  // Sending/fetching messages happens continuously while chatting, so this
  // needs a per-minute window rather than a long one.
  windowMs: parseInt(process.env.MESSAGE_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000, 
  max: parseInt(process.env.MESSAGE_RATE_LIMIT_MAX, 10) || 100,
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
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Slow down, you are uploading a lot of files.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});
