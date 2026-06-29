import { emailBloom } from '../../services/BloomfilterService.js';

export const emailMightContain = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const mightContain = emailBloom.mightContain(email);
  res.json({ mightContain });
};
