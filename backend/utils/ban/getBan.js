import banState from './banState.js';
import isActive from './isActive.js';

export function getBan(userId) {
  const ban = userId ? banState.byUser.get(String(userId)) : null;
  return ban && isActive(ban) ? ban : null;
}
