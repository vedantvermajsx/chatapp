import { signToken } from '../../utils/tokenGenerator.js';
import userCacheClient from '../../database/userCacheClient.js';
import transformCloudinaryUrl from '../../utils/transformCloudinaryUrl.js';
import {bloomFilter} from '../../utils/bloomFilterService.js';

const tempAvatar = new Map([
  [0, 'https://res.cloudinary.com/dfxi4ihfs/image/upload/v1782369805/male_g68rxt.avif'],
  [1, 'https://res.cloudinary.com/dfxi4ihfs/image/upload/v1782369805/female_qc0qfx.avif'],
  [2, 'https://res.cloudinary.com/dfxi4ihfs/image/upload/v1782369805/others_xgufdt.avif']
]);

export function getDefaultAvatar(gender) {
  let avatarUrl = tempAvatar.get(Number(gender));
  if (!avatarUrl) {
    avatarUrl = tempAvatar.get(0);
  }
  return transformCloudinaryUrl(avatarUrl);
}

export async function handleAuthSuccess(res, userDocument, role) {
  const userData = {
    id: userDocument._id.toString(),
    username: userDocument.username,
    avatar: userDocument.avatar,
    gender: userDocument.gender,
    role: role
  };

  await userCacheClient.addUserToCache(userData.id, Promise.resolve(userData));
  
  await bloomFilter.add(userData.username);
  console.log("bloomed");

  const token = signToken({ id: userDocument._id, role: role });
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('token', token, { 
    httpOnly: true, 
    sameSite: isProduction ? 'none' : 'strict', 
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000 
  });
  
  res.status(201).json({
    token,
    user: userData
  });
}
