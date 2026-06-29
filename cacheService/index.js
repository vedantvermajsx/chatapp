import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bloomRoutes from './routes/bloom.routes.js';
import cacheRoutes from './routes/cache.routes.js';
import messageRoutes from './routes/message.routes.js';
import roomRoutes from './routes/room.routes.js';
import userRoutes from './routes/user.routes.js';
import unreadRoutes from './routes/unread.routes.js';
import lastReadRoutes from './routes/lastRead.routes.js';
import messageCountRoutes from './routes/messageCount.routes.js';
import cache from './services/CacheService.js';
import { connectDB } from './database/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use(cors({
  origin: allowedOrigins,
  methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  allowedHeaders: "Content-Type"
}));


app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Cache & Bloom",
    timestamp: new Date().toISOString()
  });
});

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});
app.use(express.json());

// ── Internal-service auth ──────────────────────────────────────────────────
// CORS only governs which browser origins may read a response — it does
// nothing to stop a direct curl/server-to-server call. This service holds
// cached copies of user/message/room documents and is meant to be called
// only by our own backend/queue services, so every route below requires a
// shared secret that those services attach as a header.
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

app.use((req, res, next) => {
  if (!INTERNAL_SECRET) {
    console.error('[CacheService] INTERNAL_SERVICE_SECRET is not set — refusing all requests until configured');
    return res.status(503).json({ message: 'Service misconfigured' });
  }
  if (req.headers['x-internal-key'] !== INTERNAL_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

app.use('/cache', cacheRoutes);
app.use('/bloom', bloomRoutes);
app.use('/messages', messageRoutes);
app.use('/rooms', roomRoutes);
app.use('/users', userRoutes);
app.use('/unread', unreadRoutes);
app.use('/last-read', lastReadRoutes);
app.use('/message-count', messageCountRoutes);


app.get('/stats', (req, res) => {
  res.json(cache.getStats());
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Cache and Bloom service running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[CacheService] failed to connect to MongoDB, exiting:', err.message);
    process.exit(1);
  });
