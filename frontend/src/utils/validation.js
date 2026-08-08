export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
export const USERNAME_HINT = 'Letters, numbers, and underscores only';

export function sanitizeUsernameInput(text) {
  return (text || '').replace(/[^a-zA-Z0-9_]/g, '');
}

export function isValidUsername(username) {
  return USERNAME_REGEX.test(username || '');
}
