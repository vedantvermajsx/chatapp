import DeviceTokenCacheService from '../../services/DeviceTokenCacheService.js';

export const getDeviceTokens = (req, res) => {
  const { userId } = req.params;
  const tokens = DeviceTokenCacheService.getTokens(userId);
  res.json({ tokens });
};
