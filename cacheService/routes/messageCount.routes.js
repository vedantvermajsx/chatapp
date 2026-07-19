import express from 'express';
import { getRoomCount } from '../controllers/messageCount/getRoomCount.controller.js';
import { getPrivateCount } from '../controllers/messageCount/getPrivateCount.controller.js';
import { incrementRoomCount } from '../controllers/messageCount/incrementRoomCount.controller.js';
import { incrementRoomCountBy } from '../controllers/messageCount/incrementRoomCountBy.controller.js';
import { incrementPrivateCount } from '../controllers/messageCount/incrementPrivateCount.controller.js';
import { invalidateRoomCount } from '../controllers/messageCount/invalidateRoomCount.controller.js';
import { invalidatePrivateCount } from '../controllers/messageCount/invalidatePrivateCount.controller.js';

const router = express.Router();

router.get('/room/:roomId',                        getRoomCount);
router.get('/private/:senderId/:receiverId',       getPrivateCount);
router.post('/room/:roomId/increment',             incrementRoomCount);
router.post('/room/:roomId/increment-by',          incrementRoomCountBy);
router.post('/private/increment',                  incrementPrivateCount);
router.delete('/room/:roomId',                     invalidateRoomCount);
router.delete('/private/:senderId/:receiverId',    invalidatePrivateCount);

export default router;
