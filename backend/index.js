import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './database/db.js';
import { setupSocket } from './socket.js';
import authRoutes from './routes/auth.routes.js';
import roomRoutes from './routes/room.routes.js';
import messageRoutes from './routes/message.routes.js';
import userRoutes from './routes/user.routes.js';
import mediaRoutes from './routes/media.routes.js';
import { requestLogger } from './middleware/logger.js';
import { globalLimiter, authLimiter, messagingLimiter, uploadLimiter } from './middleware/rateLimiter.js';
import { createChessRouter, setupChessSocket } from './games/chess/index.js';
import {bloomFilter} from './utils/bloomFilterService.js';
import { setupGuestChangeStream } from './models/guest.model.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

server.on('connection', (socket) => {
  socket.setNoDelay(true);
});

server.keepAliveTimeout = 65000; 
server.headersTimeout = 66000;   

const allowedOrigins = "*";
process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Chess and messaging are mounted ahead of globalLimiter so they use their
// own per-minute limiters instead of the 200-req/15min limit applied to the
// rest of the API (that 15-minute window would otherwise choke a 200/min or
// 100/min budget down to a small fraction of its intended rate).
app.use(createChessRouter()); // chess play: 200 req/min (games/chess/chess.limiter.js)

app.use('/api/messages/upload-signature', uploadLimiter);
app.use('/api/messages', messagingLimiter, messageRoutes); // messaging: 100 req/min

app.use(globalLimiter); // everything else: 200 req/15min



app.use('/api/auth', authLimiter, authRoutes); // login/signup: 20 req/5min
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/media', mediaRoutes);
app.get('/health', (_, res) => res.status(200).json({ ok: true }));



let currentPort = process.env.PORT || 3001;

connectDB().then(async () => {
  try {
    const { default: User } = await import('./models/user.model.js');
    const { default: Guest } = await import('./models/guest.model.js');

    const [users, guests] = await Promise.all([
      User.find({}, 'username').lean(),
      Guest.find({}, 'username').lean(),
    ]);

    const usernames = [...users.map(u => u.username), ...guests.map(g => g.username)];
    
    await bloomFilter.seed(usernames);
    
    console.log(
      `Bloom filter seeded with ${users.length} users + ${guests.length} guests`
    );

    setupGuestChangeStream();
    console.log('Guest change stream setup complete');
  } catch (err) {
    console.error('Failed to seed Bloom filter or setup change stream:', err);
  }


  const io = setupSocket(server);
  app.set('io', io);
  setupChessSocket(io);
  server.listen(currentPort, () => console.log(`Server running on port ${currentPort}`));

  
  server.on('error', (error) => {

    if (error.code === 'EADDRINUSE') {
      currentPort = (+currentPort) + 1;
      server.listen(currentPort, () => console.log(`Server running on port ${currentPort}`));

    } else {
      console.error('Server failed:', error);
    }

  });

});