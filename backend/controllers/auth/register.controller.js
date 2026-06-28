import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import userCacheClient from '../../database/userCacheClient.js';
import { handleAuthSuccess } from './auth.helper.js';
import { getDefaultAvatar } from '../../utils/getDefaultAvtar.js';
import { enqueueUserRegistration } from '../../utils/queueClient.js';

const SALT_ROUNDS = 10;

export async function register(req, res) {
  try {
    const { username, email, password, gender, age, avatar, bio } = req.body;

    if (!username || !email || !password || !gender || !age) {
      return res
        .status(400)
        .json({ message: 'username, email, password, gender and age are required' });
    }

    const dupCheck = await userCacheClient.checkDuplicate(username, email);
    if (dupCheck.taken) {
      return res.status(409).json({ message: `${dupCheck.field} is already taken` });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = new mongoose.Types.ObjectId().toString();
    const resolvedAvatar = avatar || getDefaultAvatar(gender);

    const userData = {
      _id: userId,
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      gender,
      age: Number(age),
      avatar: resolvedAvatar,
      bio: bio || '',
      role: 'user',
      isOnline: true,
      lastSeen: new Date(),
    };

    await userCacheClient.addUserToCache(userId, Promise.resolve({
      _id: userId,
      username: userData.username,
      avatar: userData.avatar,
      gender: userData.gender,
      role: userData.role,
    }));

    enqueueUserRegistration(userData);

    await handleAuthSuccess(res, { _id: userId, ...userData }, 'user');
  } catch (err) {
    console.error('[register] unexpected error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
