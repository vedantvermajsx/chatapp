import express from 'express';
import {
  getLastRead,
  setRoomLastRead,
  setPrivateLastRead,
  invalidateLastRead
} from '../controllers/lastRead/lastRead.controller.js';

const router = express.Router();

router.get('/:userId/:chatKey',    getLastRead);
router.post('/:userId/room',       setRoomLastRead);
router.post('/:userId/private',    setPrivateLastRead);
router.delete('/:userId/:chatKey', invalidateLastRead);

export default router;
