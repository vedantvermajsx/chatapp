import banState from './banState.js';
import { normalizeBan } from './normalizeBan.js';

export function rebuildBans(bans) {
  const users = new Map();
  for (const b of bans) {
    const ban = normalizeBan(b);
    users.set(ban.userId, ban);
  }
  banState.byUser = users;
}
