import express from 'express';
import bloom from '../services/BloomfilterService.js';

const router = express.Router();

router.post('/add', (req, res) => {
  const { value } = req.body;
  if (!value) {
    return res.status(400).json({ error: 'Value is required' });
  }
  bloom.add(value);
  res.json({ success: true });
});

router.post('/mightContain', (req, res) => {
  const { value } = req.body;
  if (!value) {
    return res.status(400).json({ error: 'Value is required' });
  }
  const result = bloom.mightContain(value);
  res.json({ mightContain: result });
});

router.post('/seed', (req, res) => {
  const { values } = req.body;
  if (!values || !Array.isArray(values)) {
    return res.status(400).json({ error: 'Values array is required' });
  }
  bloom.seed(values);
  res.json({ success: true, count: values.length });
});

router.get('/health', (req, res) => {
  res.json({
    status: "healthy",
    service: "BloomfilterService",
    timestamp: new Date().toISOString()
  });
});


export default router;
