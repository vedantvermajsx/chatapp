import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { rejectCall } from '../controllers/call/rejectCall.controller.js';

const router = Router();

router.post('/reject', authenticate, rejectCall);

export default router;
