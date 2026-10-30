import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { reportMessage } from '../controllers/report/reportMessage.controller.js';

const router = Router();

router.post('/', authenticate, reportMessage);

export default router;
