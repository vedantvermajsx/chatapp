const _cache = new Map();

function _isExpired(entry) {
  if (!entry) return true;
  if (entry.type === 'ban' && entry.expiresAt !== null) {
    return Date.now() >= entry.expiresAt;
  }
  return false;
}

function _get(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (_isExpired(entry)) {
    _cache.delete(key);
    return null;
  }
  return entry;
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Record a 403 response from any send-message endpoint.
 *
 * @param {'banned'|'blocked'} reason  - comes from backend response body
 * @param {object} opts
 * @param {string|null}  opts.userId   - the *other* user id  (private block)
 * @param {string|null}  opts.roomId   - the room id          (room block)
 * @param {number|null}  opts.expiresAt- ms timestamp or null (ban only)
 * @param {string}       opts.message  - human-readable message from backend
 */
export function recordBlockFrom403(reason, { userId = null, roomId = null, expiresAt = null, message = '' } = {}) {
  if (reason === 'banned') {
    _cache.set('ban', { type: 'ban', expiresAt, message });
    return;
  }
  if (reason === 'blocked') {
    if (userId)  _cache.set(`block:private:${userId}`, { type: 'block', message });
    if (roomId)  _cache.set(`block:room:${roomId}`,    { type: 'block', message });
  }
}

export function getActiveBanCache() {
  return _get('ban');
}

export function isPrivateChatBlocked(userId) {
  return _get(`block:private:${userId}`);
}

export function isRoomChatBlocked(roomId) {
  return _get(`block:room:${roomId}`);
}

export function clearPrivateChatBlock(userId) {
  _cache.delete(`block:private:${userId}`);
}

export function clearRoomBlock(roomId) {
  _cache.delete(`block:room:${roomId}`);
}

export function clearBanCache() {
  _cache.delete('ban');
}


export function buildBanMessage(banEntry) {
  if (!banEntry) return 'You are banned from sending messages.';
  if (!banEntry.expiresAt) return banEntry.message || 'You are permanently banned from sending messages.';

  const msLeft = banEntry.expiresAt - Date.now();
  if (msLeft <= 0) return null; // expired

  const totalSecs = Math.ceil(msLeft / 1000);
  const hours   = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  let countdown = '';
  if (hours > 0)   countdown += `${hours}h `;
  if (minutes > 0) countdown += `${minutes}m `;
  countdown += `${seconds}s`;

  return `${banEntry.message || 'You are banned.'} Lifts in ${countdown.trim()}.`;
}
