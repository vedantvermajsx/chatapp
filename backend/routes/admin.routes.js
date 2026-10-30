import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { getOverview } from '../controllers/admin/getOverview.controller.js';
import { getUsers } from '../controllers/admin/getUsers.controller.js';
import { getGuests } from '../controllers/admin/getGuests.controller.js';
import { getUserDetail } from '../controllers/admin/getUserDetail.controller.js';
import { getRooms } from '../controllers/admin/getRooms.controller.js';
import { getReports } from '../controllers/admin/getReports.controller.js';
import { dismissReport } from '../controllers/admin/dismissReport.controller.js';
import { banUser } from '../controllers/admin/banUser.controller.js';
import { unbanUser } from '../controllers/admin/unbanUser.controller.js';
import { getBans } from '../controllers/admin/getBans.controller.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/guests', getGuests);
router.get('/users/:userId', getUserDetail);
router.get('/rooms', getRooms);

router.get('/reports', getReports);
router.post('/reports/:reportId/dismiss', dismissReport);
router.get('/bans', getBans);
router.post('/users/:userId/ban', banUser);
router.post('/users/:userId/unban', unbanUser);

export default router;
