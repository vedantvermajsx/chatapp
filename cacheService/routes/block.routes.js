import express from 'express';
import { getUserIps } from '../controllers/block/getUserIps.controller.js';
import { checkPrivate } from '../controllers/block/checkPrivate.controller.js';
import { checkRoom } from '../controllers/block/checkRoom.controller.js';
import { listUserBlocks } from '../controllers/block/listUserBlocks.controller.js';
import { putUserBlock } from '../controllers/block/putUserBlock.controller.js';
import { deleteUserBlock } from '../controllers/block/deleteUserBlock.controller.js';
import { listRoomBlocks } from '../controllers/block/listRoomBlocks.controller.js';
import { putRoomBlock } from '../controllers/block/putRoomBlock.controller.js';
import { deleteRoomBlock } from '../controllers/block/deleteRoomBlock.controller.js';
import { checkBan } from '../controllers/block/checkBan.controller.js';
import { listBans } from '../controllers/block/listBans.controller.js';
import { putBan } from '../controllers/block/putBan.controller.js';
import { deleteBan } from '../controllers/block/deleteBan.controller.js';

const router = express.Router();

router.get('/ips/:userId', getUserIps);
router.post('/check/private', checkPrivate);
router.post('/check/room', checkRoom);

router.get('/user/:blockerId', listUserBlocks);
router.put('/user/:blockerId/:blockedId', putUserBlock);
router.delete('/user/:blockerId/:blockedId', deleteUserBlock);

router.get('/room/:roomId', listRoomBlocks);
router.put('/room/:roomId/:userId', putRoomBlock);
router.delete('/room/:roomId/:userId', deleteRoomBlock);

router.post('/check/ban', checkBan);
router.get('/bans', listBans);
router.put('/ban/:userId', putBan);
router.delete('/ban/:userId', deleteBan);

export default router;
