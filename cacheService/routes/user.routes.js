import express from 'express';
import {
  seedUser,
  checkDuplicate,
  getUserById,
  getUserByUsername,
  invalidateUserCache,
} from '../controllers/user/user.controller.js';
import { setUser } from '../controllers/user/setUser.controller.js';
import { updateUser } from '../controllers/user/updateUser.controller.js';
import { deleteUser } from '../controllers/user/deleteUser.controller.js';

const router = express.Router();

router.post('/seed', seedUser);
router.post('/check-duplicate', checkDuplicate);
router.get('/by-username/:name', getUserByUsername);
router.get('/:id', getUserById);
router.post('/:id', setUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.delete('/:id/cache', invalidateUserCache);

export default router;
