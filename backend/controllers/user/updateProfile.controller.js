import userCacheClient from '../../database/userCacheClient.js';
import transformCloudinaryUrl from '../../utils/transformCloudinaryUrl.js';
import userModel from '../../models/user.model.js';

export async function updateProfile(req, res) {
  try {
    const { username, bio, avatar } = req.body;
    const userId = req.user._id;

    const user = await userCacheClient.getUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username && username !== user.username) {
      user.username = username;
    }
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) {
      user.avatar = transformCloudinaryUrl(avatar);
    }

    await userModel.findByIdAndUpdate(userId, user);
    await userCacheClient.addUserToCache(userId, Promise.resolve(user));

    const userData = {
      _id: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      role: user.role || 'user',
    };

    res.json({ message: 'Profile updated', user: userData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
