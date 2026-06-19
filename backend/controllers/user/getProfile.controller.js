export async function getProfile(req, res) {
  res.json(req.user);
}
