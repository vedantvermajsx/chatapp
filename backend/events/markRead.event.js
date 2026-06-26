import ConversationRead from "../models/conversationRead.model.js";
import { messageCacheClient } from "../database/messageCacheClient.js";
import { getIO } from "../socket.js";
import unreadCacheClient from "../database/unreadCacheClient.js";

const handleMarkRead = (socket, io) => async ({ senderId, receiverId, messageId }) => {
  if (!senderId || !receiverId || !messageId) return;

  const userId = socket.user._id || socket.user.id;

  if (receiverId !== userId) {
    socket.emit("error", { message: "Forbidden" });
    return;
  }

  // Fixed: was called with object destructuring { senderId, receiverId, messageId }
  // but getPrivateMessage expects 3 positional args (senderId, receiverId, messageId)
  const message = await messageCacheClient.getPrivateMessage(senderId, receiverId, messageId);
  if (!message) return;

  const messageTimestamp = new Date(message.timestamp);

  const existing = await ConversationRead.findOne({ senderId, receiverId })
    .select("messageId lastSeenAt")
    .lean();

  if (existing) {
    if (existing.messageId === messageId) return;
    if (existing.lastSeenAt && messageTimestamp <= new Date(existing.timestamp)) return;
  }

  const now = new Date();

  await ConversationRead.findOneAndUpdate(
    { senderId, receiverId },
    { messageId, timestamp:messageTimestamp, lastSeenAt: now },
    { upsert: true, new: true }
  );

  // Clear unread badge in cache — receiver is userId, sender is senderId
  unreadCacheClient.reset(receiverId, `private_${senderId}`).catch(() => {});

  getIO().to(senderId).emit("readReceipt", {
    senderId,
    receiverId,
    messageId,
    lastSeenAt: now,
  });
};

export default handleMarkRead;