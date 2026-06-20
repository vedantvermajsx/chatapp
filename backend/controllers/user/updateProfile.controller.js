import userCacheClient from '../../database/userCacheClient.js';
import transformCloudinaryUrl from '../../utils/transformCloudinaryUrl.js';

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

    await user.save();

    const userData = {
      id: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      role: 'user'
    };
    userCacheClient.addUserToCache(userData.id, Promise.resolve(userData));

    res.json({ 
      message: 'Profile updated', 
      user: userData 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
