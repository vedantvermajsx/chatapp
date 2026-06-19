import User from '../../models/user.model.js';


import userCache from '../../database/userCache.js';
import transformCloudinaryUrl from '../../utils/transformCloudinaryUrl.js';

export async function updateProfile(req, res) {
  try {
    const { username, bio, avatar } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username && username !== user.username) {

      user.username = username;

    }

    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) {
      user.avatar = transformCloudinaryUrl(avatar);
    }

    await user.save();

    const userData = {
      id: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      role: 'user'
    };
    userCache.addUserToCache(userData.id, Promise.resolve(userData));

    res.json({ 
      message: 'Profile updated', 
      user: userData 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
