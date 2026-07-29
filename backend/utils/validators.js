export const USERNAME_CHARS_REGEX = /^[a-zA-Z0-9_]+$/;

export function isValidUsernameFormat(username, { min = 3, max = 20 } = {}) {
  if (typeof username !== 'string') return false;
  const trimmed = username.trim();
  if (trimmed.length < min || trimmed.length > max) return false;
  return USERNAME_CHARS_REGEX.test(trimmed);
}

export function usernameValidationError(username, { min = 3, max = 20 } = {}) {
  if (!username || typeof username !== 'string' || !username.trim()) {
    return 'Username is required';
  }
  const trimmed = username.trim();
  if (trimmed.length < min || trimmed.length > max) {
    return `Username must be between ${min} and ${max} characters`;
  }
  if (!USERNAME_CHARS_REGEX.test(trimmed)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
}
