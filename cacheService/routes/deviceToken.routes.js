import express from 'express';
import { addDeviceToken } from '../controllers/deviceToken/addDeviceToken.controller.js';
import { getDeviceTokens } from '../controllers/deviceToken/getDeviceTokens.controller.js';
import { removeDeviceToken } from '../controllers/deviceToken/removeDeviceToken.controller.js';
import { removeAllDeviceTokens } from '../controllers/deviceToken/removeAllDeviceTokens.controller.js';

const router = express.Router();

router.get('/:userId', getDeviceTokens);
router.post('/:userId', addDeviceToken);
router.delete('/:userId/all', removeAllDeviceTokens);
router.delete('/:userId', removeDeviceToken);

export default router;
