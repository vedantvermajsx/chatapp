import jwt from 'jsonwebtoken';
import userCacheClient from '../database/userCacheClient.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.clearCookie('token');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userCacheClient.getUserById(String(decoded._id));

    if (!user) return res.status(401).json({ message: 'User not found' });

    const idStr = String(user._id);

    req.user = {
      _id: idStr,
      username: user.username,
      avatar: user.avatar,
      gender: user.gender,
      role: decoded.role || 'user',
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };
    next();
  } catch (err) {
    return res.status(498).json({ message: 'Invalid token' });
  }
};
