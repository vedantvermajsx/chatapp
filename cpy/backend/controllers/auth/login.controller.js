import bcrypt from 'bcryptjs';
import User from '../../models/user.model.js';
import {handleAuthSuccess} from './auth.helper.js';

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    const refactoredUsername = username.trim().toLowerCase();

    if (!refactoredUsername || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = await User.findOne({ username: refactoredUsername });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    await handleAuthSuccess(res, user, 'user');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
