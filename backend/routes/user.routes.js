import { getProfile } from '../controllers/user/getProfile.controller.js';
import { updateProfile } from '../controllers/user/updateProfile.controller.js';
import { deleteUser } from '../controllers/user/deleteUser.controller.js';
import { getActivityStatus } from '../controllers/user/getActivitystatus.js';
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';



const router = Router();


router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.delete('/:userId', authenticate, deleteUser);
router.get('/activity-status', authenticate, getActivityStatus);

export default router;