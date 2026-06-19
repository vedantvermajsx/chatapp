export function logout(req, res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'strict',
    secure: isProduction
  });
  res.json({ message: 'Logged out' });
}
