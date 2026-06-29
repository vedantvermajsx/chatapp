import { on } from '../utils/messageBroker.js';

let registered = false;

export function registerBrokerBridge(io, onlineUsers) {
  if (registered) return;
  registered = true;

  on('newRoom', (room) => {
    io.emit('newRoom', room);
  });

  on('newMessage', ({ roomId, payload }) => {
    // Re-broadcast across instances. Previously nothing subscribed to this
    // channel at all, so a receiver connected to a *different* backend
    // instance than the sender (behind the load balancer) never received
    // the message — this is the root cause of "message sometimes never
    // arrives" for the receiver. The sender's own instance already emitted
    // locally (excluding the sender's socket) before publishing here.
    io.to(roomId).emit('newMessage', payload);
  });

  on('newPrivateMessage', ({ senderId, receiverId, payload }) => {
    io.to(String(receiverId)).emit('newPrivateMessage', payload);
    io.to(String(senderId)).emit('newPrivateMessage', payload);
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