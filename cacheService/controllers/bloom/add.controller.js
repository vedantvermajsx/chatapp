import bloom from '../../services/BloomfilterService.js';

export const add = (req, res) => {
  const { value } = req.body;
  if (!value) {
    return res.status(400).json({ error: 'Value is required' });
  }
  bloom.add(value);
  res.json({ success: true });
};
