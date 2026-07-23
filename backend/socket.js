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
import handleMarkRoomRead from './events/markRoomRead.event.js';
import handleClearActiveRoom from './events/clearActiveRoom.event.js';
import { handleTyping, handleStopTyping, cleanupTypingOnDisconnect } from './events/typing.event.js';

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

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    if (socket.user?._id) {
      socket.join(String(socket.user._id));
    }

    socket.on('join', handleJoin(socket, io));
    socket.on('joinRoom', handleJoinRoom(socket, io));
    socket.on('leaveRoom', handleLeaveRoom(socket, io));
    socket.on('userLeftRoom', handleUserLeftRoom(socket, io));
    socket.on('roomUpdated', handleRoomUpdated(socket, io));
    socket.on('roomDeleted', handleRoomDeleted(socket, io));
    socket.on('webrtcSignal', handleWebrtcSignal(socket, io));
    socket.on('markRead', handleMarkRead(socket, io));
    socket.on('markRoomRead', handleMarkRoomRead(socket));
    socket.on('clearActiveRoom', handleClearActiveRoom(socket));
    socket.on('typing', handleTyping(socket, io));
    socket.on('stopTyping', handleStopTyping(socket, io));
    socket.on('disconnect', () => {
      cleanupTypingOnDisconnect(io, socket);
      handleDisconnect(socket, io)();
    });
    socket.on('error', (data) => {
      console.log("error", data);
    })
  });
}

export const getIO = () => io;