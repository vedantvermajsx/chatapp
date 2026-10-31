import { signToken } from '../../utils/tokenGenerator.js';
import userCacheClient from '../../database/userCacheClient.js';
import { recordUserIp } from '../../utils/block/recordUserIp.js';
import { getActiveBan } from '../../utils/block/getActiveBan.js';
import { isAdminUser } from '../../middleware/admin.middleware.js';

export async function handleAuthSuccess(res, userDocument, role, privateKey = null) {
  const isGuest = role === 'guest';
  const isAdmin = isAdminUser({ username: userDocument.username, role });
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
    isAdmin,
    isOnline: true,
    lastSeen: userDocument.lastSeen ?? new Date(),
  };

  const cacheProfile = {
    _id: userData._id,
    username: userData.username,
    bio: userData.bio,
    age: userData.age,
    email: userData.email,
    avatar: userData.avatar,
    gender: userData.gender,
    publicKey: userData.publicKey,
    role,
    isAdmin,
    isOnline: true,
    lastSeen: userData.lastSeen ?? new Date(),
  };

  await userCacheClient.seedUser(cacheProfile);
  await recordUserIp(res.req, userData._id, userData.username);

  const token = signToken({
    _id: userDocument._id,
    role,
    username: userDocument.username,
    avatar: userDocument.avatar,
    gender: userDocument.gender,
    age: userDocument.age,
    bio: userDocument.bio,
    isOnline: true,
    lastSeen: userDocument.lastSeen ?? new Date(),
    isGuest,
  }, isGuest);
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'strict',
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000 * (isGuest ? 1 : 7),
  });

  const response = {
    token,
    user: cacheProfile,
  };

  const ban = await getActiveBan(userDocument._id);
  if (ban) {
    response.ban = { reason: ban.reason || '', expiresAt: ban.expiresAt };
  }

  if (privateKey) {
    response.privateKey = privateKey;
  }

  res.status(201).json(response);
}
