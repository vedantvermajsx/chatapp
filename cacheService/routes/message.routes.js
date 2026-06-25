import express from 'express';
import { getRoomMessages } from '../controllers/message/getRoomMessages.controller.js';
import { getPrivateMessages } from '../controllers/message/getPrivateMessages.controller.js';
import { getPrivateMessageByIdController } from '../controllers/message/getPrivateMessageById.controller.js';
import { getPrivateChats } from '../controllers/message/getPrivateChats.controller.js';
import { invalidateMessages } from '../controllers/message/invalidateMessages.controller.js';
import { appendMessage } from '../controllers/message/appendMessage.controller.js';

const router = express.Router();

router.get('/room/:roomId', getRoomMessages);
router.get('/private/:userId/:otherUserId', getPrivateMessages);
router.get('/private/:userId/:otherUserId/:messageId', getPrivateMessageByIdController);
router.get('/private-chats/:userId', getPrivateChats);
router.post('/invalidate', invalidateMessages);
router.post('/append', appendMessage);

export default router;