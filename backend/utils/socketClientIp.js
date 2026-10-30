// Same trust rules as the HTTP clientIp util, but for a socket handshake.
export function socketClientIp(socket) {
  const secret = process.env.LB_SECRET;
  const forwarded = socket.handshake.headers['x-client-ip'];
  if (secret && forwarded && socket.handshake.headers['x-lb-secret'] === secret) {
    return String(forwarded).trim();
  }
  return socket.handshake.address;
}
