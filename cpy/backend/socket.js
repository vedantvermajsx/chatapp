import { Server } from 'socket.io';
import { connectToBroker } from './utils/messageBroker.js';
import { registerBrokerBridge } from './utils/brokerBridge.js';
import { socketAuthMiddleware } from './middleware/socketAuth.middleware.js';
import handleJoin from './events/join.event.js';
import handleJoinRoom from './events/joinRoom.event.js';
import handleLeaveRoom from './events/leaveRoom.event.js';
import handleDisconnect from './events/disconnect.event.js';
import handleUserLeftRoom from './events/userLeftRoom.event.js';
import handleRoomUpdated from './events/roomUpdated.event.js';
import handleRoomDeleted from './events/roomDeleted.event.js';
import handleWebrtcSignal from './events/webrtc/webrtcSignal.event.js';
import handleMarkRead from './events/markRead.event.js';

const onlineUsers = new Map();
const userRooms = new Map();
let io = null;

export { onlineUsers, userRooms };

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
        level: 6,
        memLevel: 8
      },
      zlibInflateOptions: {
        chunkSize: 16 * 1024
      }
    }
  });
  io.use(socketAuthMiddleware);

  registerBrokerBridge(io, onlineUsers);

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', handleJoin(socket, io));
    socket.on('joinRoom', handleJoinRoom(socket, io));
    socket.on('leaveRoom', handleLeaveRoom(socket, io));
    socket.on('disconnect', handleDisconnect(socket, io));
    socket.on('userLeftRoom', handleUserLeftRoom(socket, io));
    socket.on('roomUpdated', handleRoomUpdated(socket, io));
    socket.on('roomDeleted', handleRoomDeleted(socket, io));
    socket.on('webrtcSignal', handleWebrtcSignal(socket, io));
    socket.on('markRead', handleMarkRead(socket, io));
    socket.on('error', (data) => {
      console.log("error", data);
    })
  });
}

export const getIO = () => io;