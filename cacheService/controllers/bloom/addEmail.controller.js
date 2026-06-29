import { emailBloom } from '../../services/BloomfilterService.js';

export const addEmail = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  emailBloom.add(email);
  res.json({ success: true });
};
