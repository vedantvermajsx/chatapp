const TYPING_TIMEOUT_MS = 5000;

export const roomTyping = new Map();

export function clearRoomTimer(roomId, userId) {
  const timers = roomTyping.get(roomId);
  if (!timers) return;
  const t = timers.get(userId);
  if (t) clearTimeout(t);
  timers.delete(userId);
  if (timers.size === 0) roomTyping.delete(roomId);
}

export function stopRoomTyping(io, userId, roomId, socket) {
  clearRoomTimer(roomId, userId);
  const count = roomTyping.get(roomId)?.size ?? 0;
  socket.to(String(roomId)).emit('stopTypingRoom', { roomId, count });
}

export function handleRoomTypingEvent(socket, io, userId, roomId) {
  if (!roomId) return;
  const room = String(roomId);

  clearRoomTimer(room, userId);

  if (!roomTyping.has(room)) roomTyping.set(room, new Map());

  const timer = setTimeout(() => stopRoomTyping(io, userId, room, socket), TYPING_TIMEOUT_MS);
  roomTyping.get(room).set(userId, timer);

  const count = roomTyping.get(room).size;
  
  socket.to(room).emit('typingRoom', { roomId: room, count });
}

export function cleanupRoomTypingOnDisconnect(socket, userId) {
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
