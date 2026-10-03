import jwt from 'jsonwebtoken';

export const signToken = (payload,isGuest) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: isGuest?'24h':'7d' });

export const signTokenWithExpiry = (payload, exp) =>
  jwt.sign({ ...payload, exp }, process.env.JWT_SECRET);