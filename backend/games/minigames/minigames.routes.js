import express, { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMinigamesLimiter } from './minigames.limiter.js';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

const embedOrigins = () => {
  const raw =
    process.env.MINIGAMES_EMBED_ORIGINS ||
    process.env.CHESS_EMBED_ORIGINS ||
    process.env.CLIENT_URL ||
    'http://localhost:5173';
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

export const createMinigamesRouter = () => {
  const router = Router();
  const limiter = createMinigamesLimiter();
  const cacheAge = process.env.NODE_ENV === 'production' ? '5m' : 0;

  // /start-minigame?game=tictactoe|connect4|rps&embed=1[&name=..][&join=1234][&action=create][&rounds=3|5]
  router.get('/start-minigame', limiter, allowEmbedding, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  router.use(
    '/games/minigames',
    limiter,
    allowEmbedding,
    express.static(PUBLIC_DIR, { index: false, maxAge: cacheAge })
  );

  return router;
};
