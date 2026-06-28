import { on } from '../utils/messageBroker.js';

let registered = false;

export function registerBrokerBridge(io, onlineUsers) {
  if (registered) return;
  registered = true;

  on('newRoom', (room) => {
    io.emit('newRoom', room);
  });

  on('roomUpdated', (room) => {
    io.emit('roomUpdated', room);
  });

  on('roomDeleted', (data) => {
    io.emit('roomDeleted', data);
  });

  on('userOnline', ({ userId }) => {
    io.emit('userOnline', { userId });
  });

  on('userOffline', ({ userId }) => {
    io.emit('userOffline', { userId });
  });

  on('userJoinedRoom', ({ roomId, data }) => {
    io.to(roomId).emit('userJoinedRoom', data);
  });

  on('userLeftRoom', ({ roomId, data }) => {
    io.to(roomId).emit('userLeftRoom', data);
  });

  on('webrtcSignal', (payload) => {
    const { targetId } = payload;
    if (targetId) {
      io.to(String(targetId)).emit('webrtcSignal', payload);
    }
  });
}