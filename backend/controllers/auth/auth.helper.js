import { signToken } from '../../utils/tokenGenerator.js';
import userCacheClient from '../../database/userCacheClient.js';
import { bloomFilter } from '../../utils/bloomFilterService.js';

export async function handleAuthSuccess(res, userDocument, role) {
  const userData = {
    _id: userDocument._id.toString(),
    username: userDocument.username,
    email: userDocument.email,
    avatar: userDocument.avatar,
    gender: userDocument.gender,
    age: userDocument.age,
    bio: userDocument.bio,
    password: userDocument.password,
    role,
    isOnline: true,
    lastSeen: userDocument.lastSeen ?? new Date(),
  };

  const cacheProfile = {
    _id: userData._id,
    username: userData.username,
    avatar: userData.avatar,
    gender: userData.gender,
    role,
  };

  await userCacheClient.seedUser(cacheProfile);
  await bloomFilter.add(cacheProfile.username);
  if (userData.email) {
    await bloomFilter.addEmail(userData.email);
  }

  const token = signToken({ _id: userDocument._id, role });
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'strict',
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    token,
    user: cacheProfile,
  });
}
