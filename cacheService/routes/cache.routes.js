import express from 'express';
import { setCache } from '../controllers/cache/setCache.controller.js';
import { getCache } from '../controllers/cache/getCache.controller.js';
import { deleteCache } from '../controllers/cache/deleteCache.controller.js';
import { clearCache } from '../controllers/cache/clearCache.controller.js';

const router = express.Router();

router.post('/', setCache);
router.get('/:key', getCache);
router.delete('/:key', deleteCache);
router.delete('/', clearCache);

export default router;
