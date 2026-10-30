const allowlist = () =>
  (process.env.ADMIN_USERNAMES || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUser = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const username = String(user.username || '').toLowerCase();
  return !!username && allowlist().includes(username);
};

export const requireAdmin = (req, res, next) => {
  if (isAdminUser(req.user)) return next();

  return res.status(403).json({ message: 'Admin access required' });
};
