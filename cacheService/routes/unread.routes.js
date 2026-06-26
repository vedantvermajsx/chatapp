import express from 'express';
import {
  getUnread,
  incrementUnread,
  incrementUnreadForMembers,
  resetUnread,
  seedUnread,
  invalidateUnread
} from '../controllers/unread/unread.controller.js';

const router = express.Router();

router.get('/:userId', getUnread);
router.post('/members/increment', incrementUnreadForMembers); // no :userId — bulk op
router.post('/:userId/increment', incrementUnread);
router.post('/:userId/reset', resetUnread);
router.post('/:userId/seed', seedUnread);
router.delete('/:userId', invalidateUnread);

export default router;
