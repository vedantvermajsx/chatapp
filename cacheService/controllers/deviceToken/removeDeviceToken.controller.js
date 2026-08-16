import DeviceTokenCacheService from '../../services/DeviceTokenCacheService.js';

export const removeDeviceToken = (req, res) => {
  const { userId } = req.params;
  const { token } = req.body;

  if (!token) return res.status(400).json({ message: 'token required' });

  const deleted = DeviceTokenCacheService.removeToken(userId, token);
  res.json({ ok: true, deleted });
};
