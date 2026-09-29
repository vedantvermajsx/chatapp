import express, { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createChessLimiter } from './chess.limiter.js';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

const embedOrigins = () => {
  const raw = process.env.CHESS_EMBED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173';
  const list = raw
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return list.includes('*') ? ['*'] : ["'self'", ...list];
};

const allowEmbedding = (req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', `frame-ancestors ${embedOrigins().join(' ')}`);
  next();
};

export const createChessRouter = () => {
  const router = Router();
  const limiter = createChessLimiter();
  const cacheAge = process.env.NODE_ENV === 'production' ? '5m' : 0;

  router.get('/start-chess', limiter, allowEmbedding, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  router.use(
    '/games/chess',
    limiter,
    allowEmbedding,
    express.static(PUBLIC_DIR, { index: false, maxAge: cacheAge })
  );

  return router;
};
