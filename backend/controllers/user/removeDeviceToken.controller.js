import deviceTokenCacheClient from '../../database/deviceTokenCacheClient.js';

export async function removeDeviceToken(req, res) {
  try {
    const { token } = req.body;
    const userId = req.user._id;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'token is required' });
    }

    await deviceTokenCacheClient.removeToken(userId, token);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[removeDeviceToken] error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
