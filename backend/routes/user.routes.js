import { Router } from 'express';
import { getProfile } from '../controllers/user/getProfile.controller.js';
import { updateProfile } from '../controllers/user/updateProfile.controller.js';
import { deleteUser } from '../controllers/user/deleteUser.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import getActivityStatus from '../controllers/user/getActivityStatus.controller.js';
import { searchUsers } from '../controllers/user/searchUsers.controller.js';
import { getUserProfile } from '../controllers/user/getUserProfile.controller.js';
import { registerDeviceToken } from '../controllers/user/registerDeviceToken.controller.js';
import { removeDeviceToken } from '../controllers/user/removeDeviceToken.controller.js';


const router = Router();


router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/search', authenticate, searchUsers);
router.get('/activity-status', authenticate, getActivityStatus);
router.post('/device-token', authenticate, registerDeviceToken);
router.delete('/device-token', authenticate, removeDeviceToken);
router.get('/:userId/profile', authenticate, getUserProfile);
router.delete('/:userId', authenticate, deleteUser);

export default router;