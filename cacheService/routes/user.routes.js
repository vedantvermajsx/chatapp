import express from 'express';
import { seedUser } from '../controllers/user/seedUser.controller.js';
import { checkDuplicate } from '../controllers/user/checkDuplicate.controller.js';
import { getUserById } from '../controllers/user/getUserById.controller.js';
import { getUserByUsername } from '../controllers/user/getUserByUsername.controller.js';
import { getUsersBatch } from '../controllers/user/getUsersBatch.controller.js';
import { invalidateUserCache } from '../controllers/user/invalidateUserCache.controller.js';
import { setUser } from '../controllers/user/setUser.controller.js';
import { updateUser } from '../controllers/user/updateUser.controller.js';
import { deleteUser } from '../controllers/user/deleteUser.controller.js';

const router = express.Router();

router.post('/seed', seedUser);
router.post('/check-duplicate', checkDuplicate);
router.post('/batch', getUsersBatch);
router.get('/by-username/:name', getUserByUsername);
router.get('/:id', getUserById);
router.post('/:id', setUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.delete('/:id/cache', invalidateUserCache);

export default router;
