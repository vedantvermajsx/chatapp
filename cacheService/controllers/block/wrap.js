export const wrap = (name, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(`[BlockCache] ${name} error:`, err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};
