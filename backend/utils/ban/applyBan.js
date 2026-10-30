import banState from './banState.js';
import { normalizeBan } from './normalizeBan.js';

export function applyBan(ban) {
  if (!ban?.userId) return;
  banState.byUser.set(String(ban.userId), normalizeBan(ban));
}
