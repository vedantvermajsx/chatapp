import BloomfilterService from '../../services/BloomfilterService.js';

export const remove = async (req, res) => {
  try {
    const { value } = req.body;
    if (!value) {
      return res.status(400).json({ message: 'value is required' });
    }

    BloomfilterService.remove(value);
    res.status(200).json({ message: 'Value removed from bloom filter' });
  } catch (error) {
    console.error('[BloomController] remove error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
