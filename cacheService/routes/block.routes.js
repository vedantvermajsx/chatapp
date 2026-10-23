import express from 'express';
import * as c from '../controllers/block/block.controller.js';

const router = express.Router();

router.get('/ips/:userId', c.getUserIps);
router.post('/check/private', c.checkPrivate);
router.post('/check/room', c.checkRoom);

router.get('/user/:blockerId', c.listUserBlocks);
router.put('/user/:blockerId/:blockedId', c.putUserBlock);
router.delete('/user/:blockerId/:blockedId', c.deleteUserBlock);

router.get('/room/:roomId', c.listRoomBlocks);
router.put('/room/:roomId/:userId', c.putRoomBlock);
router.delete('/room/:roomId/:userId', c.deleteRoomBlock);

export default router;
