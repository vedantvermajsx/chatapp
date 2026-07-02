import express from 'express';
import { getUnread } from '../controllers/unread/getUnread.controller.js';
import { incrementUnread } from '../controllers/unread/incrementUnread.controller.js';
import { seedRoomOnJoin } from '../controllers/unread/seedRoomOnJoin.controller.js';
import { resetUnread } from '../controllers/unread/resetUnread.controller.js';
import { decrementUnread } from '../controllers/unread/decrementUnread.controller.js';
import { seedUnread } from '../controllers/unread/seedUnread.controller.js';
import { invalidateUnread } from '../controllers/unread/invalidateUnread.controller.js';

const router = express.Router();

router.get('/:userId', getUnread);
router.post('/:userId/room/:roomId/join-seed', seedRoomOnJoin);
router.post('/:userId/increment', incrementUnread);
router.post('/:userId/reset', resetUnread);
router.post('/:userId/decrement', decrementUnread);
router.post('/:userId/seed', seedUnread);
router.delete('/:userId', invalidateUnread);

export default router;
