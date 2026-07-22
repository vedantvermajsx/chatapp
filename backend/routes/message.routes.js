import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendRoomMessage } from '../controllers/message/sendRoomMessage.controller.js';
import { sendPrivateMessage } from '../controllers/message/sendPrivateMessage.controller.js';
import { getRoomMessages } from '../controllers/message/getRoomMessages.controller.js';
import { getPrivateMessages } from '../controllers/message/getPrivateMessages.controller.js';
import { getPrivateChats } from '../controllers/message/getPrivateChats.controller.js';
import { deletePrivateChat } from '../controllers/message/deletePrivateChat.controller.js';
import { getUploadSignature } from '../controllers/message/getUploadSignature.controller.js';
import { getLastReadStatus } from '../controllers/message/getLastReadStatus.controller.js';

const router = Router();

router.post('/send', authenticate, sendRoomMessage);
router.post('/private/send', authenticate, sendPrivateMessage);
router.get('/upload-signature', authenticate, getUploadSignature);
router.get('/room/:roomId', authenticate, getRoomMessages);
router.get('/private/:otherUserId/last-seen', authenticate, getLastReadStatus);
router.get('/private/:otherUserId', authenticate, getPrivateMessages);
router.get('/private', authenticate, getPrivateChats);
router.delete('/private/:otherUserId', authenticate, deletePrivateChat);

export default router;