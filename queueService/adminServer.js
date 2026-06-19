import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';

export function createAdminServer({ port, getStats }) {
  const app = express();

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
    res.json({
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