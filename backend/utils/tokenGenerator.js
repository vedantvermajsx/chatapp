import jwt from 'jsonwebtoken';

export const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

export const signTokenWithExpiry = (payload, exp) =>
  jwt.sign({ ...payload, exp }, process.env.JWT_SECRET);