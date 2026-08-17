import handleJoin from './join.event.js';
import handleJoinRoom from './joinRoom.event.js';
import handleLeaveRoom from './leaveRoom.event.js';
import handleDisconnect from './disconnect.event.js';
import handleUserLeftRoom from './userLeftRoom.event.js';
import handleRoomUpdated from './roomUpdated.event.js';
import handleRoomDeleted from './roomDeleted.event.js';
import handleWebrtcSignal from './webrtc/webrtcSignal.event.js';
import handleMarkRead from './markRead.event.js';
import handleMarkRoomRead from './markRoomRead.event.js';
import handleClearActiveRoom from './clearActiveRoom.event.js';
import { handleTyping, handleStopTyping, cleanupTypingOnDisconnect } from './typing.event.js';

export function setupEvents(io) {
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
    });
  });
}
