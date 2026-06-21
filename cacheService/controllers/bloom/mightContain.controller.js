import bloom from '../../services/BloomfilterService.js';

export const mightContain = (req, res) => {
  const { value } = req.body;
  if (!value) {
    return res.status(400).json({ error: 'Value is required' });
  }
  const result = bloom.mightContain(value);
  res.json({ mightContain: result });
};
