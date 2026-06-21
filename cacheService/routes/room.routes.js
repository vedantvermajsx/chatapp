import express from 'express';
import { addRoom } from '../controllers/room/addRoom.controller.js';
import { getAllRooms } from '../controllers/room/getAllRooms.controller.js';
import { checkExists } from '../controllers/room/checkExists.controller.js';
import { hasMember } from '../controllers/room/hasMember.controller.js';
import { getAdmin } from '../controllers/room/getAdmin.controller.js';
import { refreshRoom } from '../controllers/room/refreshRoom.controller.js';
import { getRoomById } from '../controllers/room/getRoomById.controller.js';
import { getRoomByName } from '../controllers/room/getRoomByName.controller.js';
import { getRoomsByUser } from '../controllers/room/getRoomsByUser.controller.js';
import { getMembers } from '../controllers/room/getMembers.controller.js';
import { invalidateMembers } from '../controllers/room/invalidateMembers.controller.js';
import { deleteRoom } from '../controllers/room/deleteRoom.controller.js';

const router = express.Router();

router.post('/', addRoom);
router.get('/', getAllRooms);
router.get('/:id/exists', checkExists);
router.get('/:id/hasMember/:userId', hasMember);
router.get('/:id/admin', getAdmin);
router.post('/:id/refresh', refreshRoom);
router.get('/:id', getRoomById);
router.get('/name/:name', getRoomByName);
router.get('/user/:userId', getRoomsByUser);
router.get('/:id/members', getMembers);
router.post('/:id/invalidate-members', invalidateMembers);
router.delete('/:id', deleteRoom);

export default router;
