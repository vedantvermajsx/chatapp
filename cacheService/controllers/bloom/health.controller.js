export const health = (req, res) => {
  res.json({
    status: "healthy",
    service: "BloomfilterService",
    timestamp: new Date().toISOString()
  });
};
