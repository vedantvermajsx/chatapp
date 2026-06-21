import express from 'express';
import { getRoomMessages } from '../controllers/message/getRoomMessages.controller.js';
import { getPrivateMessages } from '../controllers/message/getPrivateMessages.controller.js';
import { getPrivateChats } from '../controllers/message/getPrivateChats.controller.js';
import { invalidateMessages } from '../controllers/message/invalidateMessages.controller.js';
import { appendMessages } from '../controllers/message/appendMessages.controller.js';

const router = express.Router();

router.get('/room/:roomId', getRoomMessages);
router.get('/private/:userId/:otherUserId', getPrivateMessages);
router.get('/private-chats/:userId', getPrivateChats);
router.post('/invalidate', invalidateMessages);
router.post('/append', appendMessages);

export default router;
