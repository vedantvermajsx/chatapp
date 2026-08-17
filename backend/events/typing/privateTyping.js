const TYPING_TIMEOUT_MS = 5000;

export const privateTyping = new Map();

export function clearPrivateTimer(receiverId, senderId) {
  const timers = privateTyping.get(receiverId);
  if (!timers) return;
  const t = timers.get(senderId);
  if (t) clearTimeout(t);
  timers.delete(senderId);
  if (timers.size === 0) privateTyping.delete(receiverId);
}

export function stopPrivateTyping(io, senderId, receiverId) {
  clearPrivateTimer(receiverId, senderId);
  io.to(String(receiverId)).emit('stopTypingPrivate', { senderId });
}

export function handlePrivateTypingEvent(io, userId, username, receiverId, charCount) {
  if (!receiverId) return;
  const target = String(receiverId);

  clearPrivateTimer(target, userId);

  if (!privateTyping.has(target)) privateTyping.set(target, new Map());

  const timer = setTimeout(() => stopPrivateTyping(io, userId, target), TYPING_TIMEOUT_MS);
  privateTyping.get(target).set(userId, timer);

  io.to(target).emit('typingPrivate', { senderId: userId, username, charCount });
}

export function cleanupPrivateTypingOnDisconnect(io, userId) {
  for (const [receiverId, timers] of privateTyping.entries()) {
    if (timers.has(userId)) {
      clearTimeout(timers.get(userId));
      timers.delete(userId);
      if (timers.size === 0) privateTyping.delete(receiverId);
      io.to(receiverId).emit('stopTypingPrivate', { senderId: userId });
    }
  }
}
