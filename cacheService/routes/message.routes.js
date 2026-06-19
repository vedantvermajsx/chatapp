import express from 'express';
import {
  getRoomMessages,
  getPrivateMessages,
  getPrivateChats,
  invalidateRoomMessages,
  invalidatePrivateMessages
} from '../services/MessageCacheService.js';

const router = express.Router();

function mapRoomMessage(msg) {
  const formatted = {
    id: msg._id,
    text: msg.content,
    timestamp: msg.timestamp,
    senderId: msg.senderId
  };
  if (msg.media) formatted.media = msg.media;
  return formatted;
}

function mapPrivateMessage(msg) {
  return {
    id: msg._id,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    text: msg.content,
    timestamp: msg.timestamp,
    media: msg.media || null
  };
}

// GET /messages/room/:roomId?limit=20&before=<ISO timestamp>
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 20, before } = req.query;

    const result = await getRoomMessages({
      roomId,
      limit,
      before,
      mapMessage: mapRoomMessage
    });

    res.json(result);
  } catch (error) {
    console.error('[CacheService] error getting room messages:', error);
    res.status(500).json({ message: 'Failed to get room messages', error: error.message });
  }
});

// GET /messages/private/:userId/:otherUserId?limit=20&before=<ISO timestamp>
router.get('/private/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const { limit = 20, before } = req.query;

    const result = await getPrivateMessages({
      userId,
      otherUserId,
      limit,
      before,
      mapMessage: mapPrivateMessage
    });

    res.json(result);
  } catch (error) {
    console.error('[CacheService] error getting private messages:', error);
    res.status(500).json({ message: 'Failed to get private messages', error: error.message });
  }
});

// GET /messages/private-chats/:userId
router.get('/private-chats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await getPrivateChats(userId);
    res.json({ chats });
  } catch (error) {
    console.error('[CacheService] error getting private chats:', error);
    res.status(500).json({ message: 'Failed to get private chats', error: error.message });
  }
});

// POST /messages/invalidate { roomId } OR { senderId, receiverId }
router.post('/invalidate', (req, res) => {
  const { roomId, senderId, receiverId } = req.body;

  if (roomId) {
    invalidateRoomMessages(roomId);
  } else if (senderId && receiverId) {
    invalidatePrivateMessages(senderId, receiverId);
  } else {
    return res.status(400).json({ error: 'roomId or (senderId and receiverId) required' });
  }

  res.json({ success: true });
});

export default router;
