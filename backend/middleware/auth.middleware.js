import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Guest from '../models/guest.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    

    if (!token){
      res.clearCookie("token");
     return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (decoded.role === 'guest') {
      user = await Guest.findById(decoded.id);
    } else {
      user = await User.findById(decoded.id).select('-password');
    }


    if (!user) return res.status(498).json({ message: 'User not found' });

    req.user = {
      _id: user._id,
      id: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      gender: user.gender,
      role: decoded.role || 'user',
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    };
    next();
  } catch (err) {
    return res.status(498).json({ message: 'Invalid token' });
  }
};