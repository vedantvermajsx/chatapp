import ConversationRead from "../models/conversationRead.model.js";
import { getIO } from "../socket.js";

export default function handleMarkRead(socket) {
  return async ({ senderId, receiverId, messageId }) => {
    console.log("markRead", senderId, receiverId, messageId);
    if (!senderId || !receiverId || !messageId) return;

    const userId = socket.user._id || socket.user.id;

    if (receiverId !== userId) {
      socket.emit("error", {
        message: "Forbidden",
      });
      return;
    }

    const now = new Date();

    await ConversationRead.findOneAndUpdate(
      {
        senderId,
        receiverId,
      },
      {
        messageId,
        lastSeenAt: now,
      },
      {
        upsert: true,
        new: true,
      }
    );

    const io = getIO();

    io.to(senderId).emit("readReceipt", {
      senderId,
      receiverId,
      messageId,
      lastSeenAt: now,
    });
  };
}