import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bloomRoutes from './routes/bloom.routes.js';
import cacheRoutes from './routes/cache.routes.js';
import messageRoutes from './routes/message.routes.js';
import roomRoutes from './routes/room.routes.js';
import userRoutes from './routes/user.routes.js';
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

app.use('/cache', cacheRoutes);
app.use('/bloom', bloomRoutes);
app.use('/messages', messageRoutes);
app.use('/rooms', roomRoutes);
app.use('/users', userRoutes);


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
