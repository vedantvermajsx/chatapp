import bcrypt from 'bcryptjs';
import { generateGuestId } from '../../utils/idGenerator.js';
import { handleAuthSuccess } from './auth.helper.js';
import { isUsernameTaken } from './usernameTaken.js';
import { enqueueGuestRegistration } from '../../utils/queueClient.js';
import { getDefaultAvatar } from '../../utils/getDefaultAvtar.js';

export async function createGuest(req, res) {
  try {
    const { username, gender, age } = req.body;

    const refactoredUsername = username?.trim().toLowerCase();

    if (!refactoredUsername) {
      return res.status(400).json({ message: 'Username is required' });
    }
    if (gender === undefined || !age) {
      return res.status(400).json({ message: 'Gender and age required' });
    }
    if (refactoredUsername.length < 2 || refactoredUsername.length > 30) {
      return res.status(400).json({ message: 'Username must be 2–30 characters' });
    }

    const taken = await isUsernameTaken(refactoredUsername);
    if (taken) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const guestId = generateGuestId();
    const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
    const defaultAvatar = getDefaultAvatar(gender);

    const guestData = {
      _id: guestId,
      username: refactoredUsername,
      gender: Number(gender),
      age: Number(age),
      password: hashedPassword,
      avatar: defaultAvatar,
      isOnline: true,
      lastSeen: new Date(),
    };

    enqueueGuestRegistration(guestData);

    await handleAuthSuccess(res, { _id: guestId, ...guestData }, 'guest');
  } catch (err) {
    console.error('[createGuest] unexpected error:', err.message);
    res.status(500).json({ message: err.message });
  }
}
