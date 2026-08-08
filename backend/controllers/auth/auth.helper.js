import { signToken } from '../../utils/tokenGenerator.js';
import userCacheClient from '../../database/userCacheClient.js';

export async function handleAuthSuccess(res, userDocument, role, privateKey = null) {
  const userData = {
    _id: userDocument._id.toString(),
    username: userDocument.username,
    email: userDocument.email,
    avatar: userDocument.avatar,
    gender: userDocument.gender,
    age: userDocument.age,
    bio: userDocument.bio,
    password: userDocument.password,
    publicKey: userDocument.publicKey ?? null,
    role,
    isOnline: true,
    lastSeen: userDocument.lastSeen ?? new Date(),
  };

  const cacheProfile = {
    _id: userData._id,
    username: userData.username,
    email: userData.email,
    avatar: userData.avatar,
    gender: userData.gender,
    publicKey: userData.publicKey,
    role,
  };

  await userCacheClient.seedUser(cacheProfile);

  const token = signToken({
    _id: userDocument._id,
    role,
    username: userDocument.username,
    avatar: userDocument.avatar,
    gender: userDocument.gender,
    isOnline: true,
    lastSeen: userDocument.lastSeen ?? new Date(),
  });
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'strict',
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000,
  });

  const response = {
    token,
    user: cacheProfile,
  };

  if (privateKey) {
    response.privateKey = privateKey;
  }

  res.status(201).json(response);
}
