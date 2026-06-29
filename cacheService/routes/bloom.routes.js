import express from 'express';
import { add } from '../controllers/bloom/add.controller.js';
import { mightContain } from '../controllers/bloom/mightContain.controller.js';
import { seed } from '../controllers/bloom/seed.controller.js';
import { health } from '../controllers/bloom/health.controller.js';
import { remove } from '../controllers/bloom/remove.controller.js';
import { addEmail } from '../controllers/bloom/addEmail.controller.js';
import { emailMightContain } from '../controllers/bloom/emailMightContain.controller.js';

const router = express.Router();

router.post('/add', add);
router.post('/mightContain', mightContain);
router.post('/seed', seed);
router.post('/remove', remove);
router.post('/addEmail', addEmail);
router.post('/emailMightContain', emailMightContain);
router.get('/health', health);

export default router;
