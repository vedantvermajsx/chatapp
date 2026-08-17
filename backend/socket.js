import { Server } from 'socket.io';
import { connectToBroker } from './utils/messageBroker.js';
import { registerBrokerBridge } from './utils/brokerBridge.js';
import { socketAuthMiddleware } from './middleware/socketAuth.middleware.js';
import { setupEvents } from './events/setupEvents.js';

const onlineUsers = new Map();
const userRooms = new Map();
const activeRooms = new Map();
let io = null;

export { onlineUsers, userRooms, activeRooms };

export const setupSocket = (server) => {
  connectToBroker();

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    perMessageDeflate: {
      threshold: 8,
      zlibDeflateOptions: {
        chunkSize: 16 * 1024,
        level: 3,
        memLevel: 9
      },
      zlibInflateOptions: {
        chunkSize: 16 * 1024
      }
    },
    pingInterval: 10000,    
    pingTimeout: 5000,      
    upgradeTimeout: 10000,  
    transports: ['websocket', 'polling'],
  });
  io.use(socketAuthMiddleware);

  registerBrokerBridge(io, onlineUsers);

  setupEvents(io);
}

export const getIO = () => io;