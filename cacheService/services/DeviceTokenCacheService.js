const MAX_TTL_MS = 24 * 60 * 60 * 1000; 
const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

const store = new Map();

function clampTtlMs(ttlMs) {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0 || ttlMs > MAX_TTL_MS) return MAX_TTL_MS;
  return ttlMs;
}

function addToken(userId, token, platform = 'android', ttlMs = MAX_TTL_MS) {
  if (!userId || !token) return false;

  let tokens = store.get(userId);
  if (!tokens) {
    tokens = new Map();
    store.set(userId, tokens);
  }

  tokens.set(token, {
    platform,
    expiresAt: Date.now() + clampTtlMs(ttlMs),
  });

  return true;
}

function removeToken(userId, token) {
  const tokens = store.get(userId);
  if (!tokens) return false;

  const deleted = tokens.delete(token);
  if (tokens.size === 0) store.delete(userId);
  return deleted;
}

function removeAllForUser(userId) {
  return store.delete(userId);
}

function getTokens(userId) {
  const tokens = store.get(userId);
  if (!tokens) return [];

  const now = Date.now();
  const active = [];

  for (const [token, meta] of tokens) {
    if (meta.expiresAt <= now) {
      tokens.delete(token);
      continue;
    }
    active.push({ token, platform: meta.platform, expiresAt: meta.expiresAt });
  }

  if (tokens.size === 0) store.delete(userId);
  return active;
}

function sweep() {
  const now = Date.now();
  let removed = 0;

  for (const [userId, tokens] of store) {
    for (const [token, meta] of tokens) {
      if (meta.expiresAt <= now) {
        tokens.delete(token);
        removed++;
      }
    }
    if (tokens.size === 0) store.delete(userId);
  }

  if (removed > 0) {
    console.log(`[DeviceTokenCacheService] swept ${removed} expired token(s)`);
  }
}

const sweepTimer = setInterval(sweep, SWEEP_INTERVAL_MS);
sweepTimer.unref?.();

function getStats() {
  let totalTokens = 0;
  for (const tokens of store.values()) totalTokens += tokens.size;
  return { users: store.size, tokens: totalTokens, maxTtlMs: MAX_TTL_MS };
}

export default {
  MAX_TTL_MS,
  addToken,
  removeToken,
  removeAllForUser,
  getTokens,
  getStats,
};
