import DeviceTokenCacheService from '../../services/DeviceTokenCacheService.js';

export const addDeviceToken = (req, res) => {
  const { userId } = req.params;
  const { token, platform, ttlMs } = req.body;

  if (!token) return res.status(400).json({ message: 'token required' });

  const ok = DeviceTokenCacheService.addToken(userId, token, platform, ttlMs);
  if (!ok) return res.status(400).json({ message: 'userId and token required' });

  res.json({ ok: true });
};
