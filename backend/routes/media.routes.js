import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getStickers } from '../controllers/media/getStickers.controller.js';

const router = Router();

router.get('/:type/trending', authenticate, getStickers);
router.get('/:type/search', authenticate, getStickers);

export default router;
