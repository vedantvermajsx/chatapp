import express from 'express';
import {
  getRoomCount,
  getPrivateCount,
  incrementRoomCount,
  incrementPrivateCount,
  invalidateRoomCount,
  invalidatePrivateCount
} from '../controllers/messageCount/messageCount.controller.js';

const router = express.Router();

router.get('/room/:roomId',                        getRoomCount);
router.get('/private/:senderId/:receiverId',       getPrivateCount);
router.post('/room/:roomId/increment',             incrementRoomCount);
router.post('/private/increment',                  incrementPrivateCount);
router.delete('/room/:roomId',                     invalidateRoomCount);
router.delete('/private/:senderId/:receiverId',    invalidatePrivateCount);

export default router;
