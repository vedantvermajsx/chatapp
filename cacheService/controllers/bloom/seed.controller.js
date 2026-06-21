import bloom from '../../services/BloomfilterService.js';

export const seed = (req, res) => {
  const { values } = req.body;
  if (!values || !Array.isArray(values)) {
    return res.status(400).json({ error: 'Values array is required' });
  }
  bloom.seed(values);
  res.json({ success: true, count: values.length });
};
