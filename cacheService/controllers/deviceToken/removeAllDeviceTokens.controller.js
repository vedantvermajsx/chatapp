import DeviceTokenCacheService from '../../services/DeviceTokenCacheService.js';

export const removeAllDeviceTokens = (req, res) => {
  const { userId } = req.params;
  const deleted = DeviceTokenCacheService.removeAllForUser(userId);
  res.json({ ok: true, deleted });
};
