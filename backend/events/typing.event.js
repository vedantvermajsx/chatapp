import { onlineUsers } from '../socket.js';

const TYPING_TIMEOUT_MS = 5000;

const privateTyping = new Map();

const roomTyping = new Map();

function clearPrivateTimer(receiverId, senderId) {
  const timers = privateTyping.get(receiverId);
  if (!timers) return;
  const t = timers.get(senderId);
  if (t) clearTimeout(t);
  timers.delete(senderId);
  if (timers.size === 0) privateTyping.delete(receiverId);
}

function clearRoomTimer(roomId, userId) {
  const timers = roomTyping.get(roomId);
  if (!timers) return;
  const t = timers.get(userId);
  if (t) clearTimeout(t);
  timers.delete(userId);
  if (timers.size === 0) roomTyping.delete(roomId);
}

function stopPrivateTyping(io, senderId, receiverId) {
  clearPrivateTimer(receiverId, senderId);
  io.to(String(receiverId)).emit('stopTypingPrivate', { senderId });
}

function stopRoomTyping(io, userId, roomId, socket) {
  clearRoomTimer(roomId, userId);
  const count = roomTyping.get(roomId)?.size ?? 0;
  socket.to(String(roomId)).emit('stopTypingRoom', { roomId, count });
}


export function handleTyping(socket, io) {
  return ({ type, receiverId, roomId, charCount }) => {
    const userId   = String(socket.user._id || socket.user.id);
    const username = socket.user.username;

    if (type === 'private') {
      if (!receiverId) return;
      const target = String(receiverId);

      clearPrivateTimer(target, userId);

      if (!privateTyping.has(target)) privateTyping.set(target, new Map());

      const timer = setTimeout(() => stopPrivateTyping(io, userId, target), TYPING_TIMEOUT_MS);
      privateTyping.get(target).set(userId, timer);

      io.to(target).emit('typingPrivate', { senderId: userId, username, charCount });

    } else if (type === 'room') {
      if (!roomId) return;
      const room = String(roomId);

      clearRoomTimer(room, userId);

      if (!roomTyping.has(room)) roomTyping.set(room, new Map());

      const timer = setTimeout(() => stopRoomTyping(io, userId, room, socket), TYPING_TIMEOUT_MS);
      roomTyping.get(room).set(userId, timer);

      const count = roomTyping.get(room).size;
      
      socket.to(room).emit('typingRoom', { roomId: room, count });
    }
  };
}


export function handleStopTyping(socket, io) {
  return ({ type, receiverId, roomId }) => {
    const userId = String(socket.user._id || socket.user.id);

    if (type === 'private') {
      if (!receiverId) return;
      stopPrivateTyping(io, userId, String(receiverId));

    } else if (type === 'room') {
      if (!roomId) return;
      stopRoomTyping(io, userId, String(roomId), socket);
    }
  };
}


export function cleanupTypingOnDisconnect(io, socket) {
  const userId = String(socket.user?._id || socket.user?.id);
  if (!userId) return;


  for (const [receiverId, timers] of privateTyping.entries()) {
    if (timers.has(userId)) {
      clearTimeout(timers.get(userId));
      timers.delete(userId);
      if (timers.size === 0) privateTyping.delete(receiverId);
      io.to(receiverId).emit('stopTypingPrivate', { senderId: userId });
    }
  }

  for (const [roomId, timers] of roomTyping.entries()) {
    if (timers.has(userId)) {
      clearTimeout(timers.get(userId));
      timers.delete(userId);
      if (timers.size === 0) roomTyping.delete(roomId);
      const count = roomTyping.get(roomId)?.size ?? 0;
      socket.to(roomId).emit('stopTypingRoom', { roomId, count });
    }
  }
}