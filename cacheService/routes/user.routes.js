import express from 'express';
import { getUser } from '../controllers/user/getUser.controller.js';
import { setUser } from '../controllers/user/setUser.controller.js';
import { updateUser } from '../controllers/user/updateUser.controller.js';
import { deleteUser } from '../controllers/user/deleteUser.controller.js';

const router = express.Router();

router.get('/:id', getUser);
router.post('/', setUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
