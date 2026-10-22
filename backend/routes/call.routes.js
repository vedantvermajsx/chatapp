import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { rejectCall } from '../controllers/call/rejectCall.controller.js';
import { getIceServers } from '../controllers/call/getIceServers.controller.js';

const router = Router();

router.post('/reject', authenticate, rejectCall);
router.get('/ice-servers', authenticate, getIceServers);

export default router;
