import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import rateLimit from 'express-rate-limit';

export function createAdminServer({ port, getStats }) {
  const app = express();

  const adminLimiter = rateLimit({
    windowMs: parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000,
    max: parseInt(process.env.ADMIN_RATE_LIMIT_MAX, 10) || 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ message: 'Too many requests to admin server.' });
    },
  });
  app.use(adminLimiter);

  const server = http.createServer(app);

  const wss = new WebSocketServer({
    server,
    path: '/ws'
  });

  wss.on('connection', (ws) => {
    console.log('[QueueService] WS client connected');

    ws.on('close', () => {
      console.log('[QueueService] WS client disconnected');
    });
  });

  app.get('/stats', (req, res) => {
    res.json({
      service: 'QueueService',
      ...getStats()
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  server.listen(port, () => {
    console.log(`[QueueService] server running on port ${port}`);
  });

  return server;
}