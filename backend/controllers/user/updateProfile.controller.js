import userCacheClient from '../../database/userCacheClient.js';
import transformCloudinaryUrl from '../../utils/transformCloudinaryUrl.js';
import userModel from '../../models/user.model.js';
import { usernameValidationError } from '../../utils/validators.js';
import { isUsernameTaken } from '../auth/usernameTaken.js';
import { bloomFilter } from '../../utils/bloomFilterService.js';
import { signTokenWithExpiry } from '../../utils/tokenGenerator.js';

export async function updateProfile(req, res) {
  try {
    const { username, bio, avatar } = req.body;
    const userId = req.user._id;

    let user = {
      _id: userId,
      username: req.user.username,
      avatar: req.user.avatar,
      gender: req.user.gender,
      role: req.user.role || 'user',
      bio: req.user.bio,
      publicKey: req.user.publicKey ?? null,
    };


    try {
      const cachedUser = await userCacheClient.getUserById(userId);
      console.log(cachedUser);
      if (cachedUser) user = { ...user, ...cachedUser };
    } catch (err) {
      console.warn("updateProfile cache get error:", err.message);
    }

    const previousUsername = user.username;
    let usernameChanged = false;

    if (username && username.trim().toLowerCase() !== user.username) {
      const formatError = usernameValidationError(username);
      if (formatError) {
        return res.status(400).json({ message: formatError });
      }

      const normalized = username.trim().toLowerCase();
      const taken = await isUsernameTaken(normalized);
      if (taken) {
        return res.status(409).json({ message: 'username is already taken' });
      }

      user.username = normalized;
      usernameChanged = true;
    }
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) {
      user.avatar = transformCloudinaryUrl(avatar);
    }

    await userModel.findByIdAndUpdate(userId, user);
    userCacheClient.addUserToCache(userId, Promise.resolve(user)).catch(() => {});

    if (usernameChanged) {
      bloomFilter.add(user.username).catch((err) =>
        console.warn('[updateProfile] bloomFilter.add failed:', err.message)
      );
      bloomFilter.remove(previousUsername).catch((err) =>
        console.warn('[updateProfile] bloomFilter.remove failed:', err.message)
      );
    }

    const userData = {
      _id: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      role: user.role || 'user',
      bio: user.bio,
      publicKey: user.publicKey ?? null,
    };

    
    //jwt reissue
    let newToken = null;
    if (req.user.exp) {
      const now = Math.floor(Date.now() / 1000);
      const remainingSeconds = req.user.exp - now;

      if (remainingSeconds > 0) {
        newToken = signTokenWithExpiry(
          {
            _id: userId,
            role: user.role || 'user',
            username: user.username,
            avatar: user.avatar,
            gender: req.user.gender,
            isOnline: req.user.isOnline,
            lastSeen: req.user.lastSeen,
          },
          req.user.exp
        );

        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', newToken, {
          httpOnly: true,
          sameSite: isProduction ? 'none' : 'strict',
          secure: isProduction,
          maxAge: remainingSeconds * 1000,
        });
      }
    }

    res.json({ message: 'Profile updated', user: userData, ...(newToken ? { token: newToken } : {}) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}