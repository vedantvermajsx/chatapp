import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import {
  getOverview,
  getUsers,
  getGuests,
  getUserDetail,
  getRooms,
} from '../controllers/admin/analytics.controller.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/guests', getGuests);
router.get('/users/:userId', getUserDetail);
router.get('/rooms', getRooms);

export default router;
