import banState from './banState.js';

export function clearBan(userId) {
  banState.byUser.delete(String(userId));
}
