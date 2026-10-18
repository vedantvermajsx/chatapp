const isPlainObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Structural equality for the plain data we cache (chats / rooms / last messages).
 * Dates are compared by time, everything else by value.
 */
export function deepEqual(a, b) {
  if (a === b) return true;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (!isPlainObject(a) || !isPlainObject(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Stable union merge of `incoming` (fresh server snapshot Y) into `prev` (cached X).
 *
 * - The existing list order is preserved, so nothing re-shuffles on refetch.
 * - A row that is unchanged (structurally equal) reuses the previous object
 *   reference so memoized rows don't re-render.
 * - A row that changed is field-merged (`{ ...existing, ...incoming }`) so
 *   cache-only fields survive the server update.
 * - Rows that exist only in `prev` keep their position (never removed).
 * - Rows the server returns that `prev` has never seen are appended at the end.
 */
export function mergeByKey(prev, incoming, getKey) {
  const prevList = Array.isArray(prev) ? prev : [];
  const incomingList = Array.isArray(incoming) ? incoming : [];

  const incomingByKey = new Map();
  for (const item of incomingList) {
    const key = getKey(item);
    if (key === null || key === undefined) continue;
    const keyStr = String(key);
    if (!incomingByKey.has(keyStr)) incomingByKey.set(keyStr, item);
  }

  const result = [];
  const seen = new Set();

  // 1. Walk the existing list first — order stays exactly as the user saw it.
  for (const item of prevList) {
    const key = getKey(item);
    const keyStr = key === null || key === undefined ? null : String(key);
    if (keyStr === null) {
      result.push(item);
      continue;
    }
    if (seen.has(keyStr)) continue;
    seen.add(keyStr);

    const fresh = incomingByKey.get(keyStr);
    if (fresh === undefined) {
      result.push(item); // cache-only row: keep it, in place
    } else {
      result.push(deepEqual(item, fresh) ? item : { ...item, ...fresh });
    }
  }

  // 2. Append anything the server sent that we had never seen before.
  for (const item of incomingList) {
    const key = getKey(item);
    if (key === null || key === undefined) {
      result.push(item);
      continue;
    }
    const keyStr = String(key);
    if (seen.has(keyStr)) continue;
    seen.add(keyStr);
    result.push(item);
  }

  return result;
}
