import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.clearCookie('token');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const idStr = String(decoded._id);

    req.user = {
      _id: idStr,
      username: decoded.username,
      avatar: decoded.avatar,
      gender: decoded.gender,
      role: decoded.role || 'user',
      isOnline: decoded.isOnline,
      lastSeen: decoded.lastSeen,
    };
    next();
  } catch (err) {
    return res.status(498).json({ message: 'Invalid token' });
  }
};
