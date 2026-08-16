import deviceTokenCacheClient from '../../database/deviceTokenCacheClient.js';

const ALLOWED_PLATFORMS = ['android', 'ios'];

export async function registerDeviceToken(req, res) {
  try {
    const { token, platform } = req.body;
    const userId = req.user._id;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'token is required' });
    }

    const safePlatform = ALLOWED_PLATFORMS.includes(platform) ? platform : 'android';

    let ttlMs;
    if (req.user.exp) {
      ttlMs = req.user.exp * 1000 - Date.now();
    }

    await deviceTokenCacheClient.addToken(userId, token, safePlatform, ttlMs);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[registerDeviceToken] error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
