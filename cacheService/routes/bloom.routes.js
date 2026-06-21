import express from 'express';
import { add } from '../controllers/bloom/add.controller.js';
import { mightContain } from '../controllers/bloom/mightContain.controller.js';
import { seed } from '../controllers/bloom/seed.controller.js';
import { health } from '../controllers/bloom/health.controller.js';

const router = express.Router();

router.post('/add', add);
router.post('/mightContain', mightContain);
router.post('/seed', seed);
router.get('/health', health);

export default router;
