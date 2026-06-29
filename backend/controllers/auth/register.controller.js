import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import userCacheClient from '../../database/userCacheClient.js';
import { handleAuthSuccess } from './auth.helper.js';
import { getDefaultAvatar } from '../../utils/getDefaultAvtar.js';
import { enqueueUserRegistration } from '../../utils/queueClient.js';
import User from '../../models/user.model.js';
import { isUsernameTaken } from './usernameTaken.js';
import { bloomFilter } from '../../utils/bloomFilterService.js';

const SALT_ROUNDS = 10;

export async function register(req, res) {
  try {
    const { username, email, password, gender, dob, avatar, bio } = req.body;

    if(gender==undefined || gender<0 || gender>2){
      return res.status(400).json({message:"Invalid gender !"});
    }

    if (!username || !email || !password || gender === undefined || !dob) {
      return res
        .status(400)
        .json({ message: 'username, email, password, gender and dob are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    if (await bloomFilter.emailMightContain(trimmedEmail)) {
      const emailExists = await User.exists({ email: trimmedEmail });
      if (emailExists) {
        return res.status(409).json({ message: `email is already taken` });
      }
    }

    const usernameTaken = await isUsernameTaken(username.trim());
    if (usernameTaken) {
      return res.status(409).json({ message: `username is already taken` });
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
      dob: new Date(dob),
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
