import { Router } from 'express';
import { register } from '../controllers/auth/register.controller.js';
import { login } from '../controllers/auth/login.controller.js';
import { createGuest } from '../controllers/auth/guest.controller.js';
import { logout } from '../controllers/auth/logout.controller.js';
import { checkUsername } from '../controllers/auth/checkUsername.controller.js';

const router = Router();

router.get('/check-username', checkUsername);
router.post('/register', register);
router.post('/login', login);
router.post('/guest', createGuest);
router.post('/logout', logout);

export default router;