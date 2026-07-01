export const health = (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "BloomfilterService",
    timestamp: new Date().toISOString()
  });
};
