const isActive = (ban) => !ban.expiresAt || ban.expiresAt > Date.now();

export default isActive;
