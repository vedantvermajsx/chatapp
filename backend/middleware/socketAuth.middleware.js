import { authenticate } from './auth.middleware.js';

export const socketAuthMiddleware = (socket, next) => {
  let token = socket.handshake.auth?.token;
  
  const authHeader = socket.handshake.headers?.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token && socket.handshake.headers?.cookie) {
    const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, current) => {
      const [name, ...value] = current.trim().split('=');
      acc[name] = value.join('=');
      return acc;
    }, {});
    token = cookies.token || token;
  }

  const req = {
    cookies: { token },
    headers: { authorization: token ? `Bearer ${token}` : '' }
  };

  const res = {
    clearCookie: () => {},
    status: (code) => ({
      json: (data) => next(new Error(`Authentication error: ${data.message || code}`))
    })
  };

  authenticate(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    if (req.user) {
      socket.user = req.user;
      next();
    } else {
      next(new Error('Authentication error: Could not attach user to socket'));
    }
  });
};
