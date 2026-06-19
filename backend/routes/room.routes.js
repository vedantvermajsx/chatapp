import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getRooms } from '../controllers/room/getRooms.controller.js';
import { createRoom } from '../controllers/room/createRoom.controller.js';
import { joinRoom } from '../controllers/room/joinRoom.controller.js';
import { getRoomMembers } from '../controllers/room/getRoomMembers.controller.js';
import { updateRoom } from '../controllers/room/updateRoom.controller.js';
import { deleteRoom } from '../controllers/room/deleteRoom.controller.js';

const router = Router();

router.get('/', authenticate, getRooms);
router.post('/create', authenticate, createRoom);
router.post('/join', authenticate, joinRoom);
router.get('/:roomId/members', authenticate, getRoomMembers);
router.put('/:roomId', authenticate, updateRoom);
router.delete('/:roomId', authenticate, deleteRoom);

export default router;