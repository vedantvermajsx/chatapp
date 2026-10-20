import { MAX_MESSAGES_PER_CHAT } from '../services/indexedDB/core.js';

export const MAX_MESSAGES = MAX_MESSAGES_PER_CHAT;

export const idOf = (m) => String(m?.id || m?._id);

const tsOf = (m) => {
  const t = typeof m?.timestamp === 'number' ? m.timestamp : Date.parse(m?.timestamp);
  return Number.isNaN(t) ? 0 : t;
};

export const compareMessages = (a, b) =>
  tsOf(a) - tsOf(b) || idOf(a).localeCompare(idOf(b));

export const persistable = (list) =>
  (list || []).filter((m) => m && !m.isPending && (m.id || m._id));

export const capNewest = (list) => list;

export const withCap = (entry, list) => ({
  ...entry,
  messages: list,
  hasMore: entry?.hasMore ?? false,
});

export const mergeNewer = (current, incoming) => {
  const byId = new Map((incoming || []).map((m) => [idOf(m), m]));
  const seen = new Set();
  const updated = current.map((m) => {
    const n = byId.get(idOf(m));
    if (!n) return m;
    seen.add(idOf(m));
    return { ...m, ...n };
  });
  const fresh = (incoming || []).filter((m) => !seen.has(idOf(m)));
  const all = [...updated, ...fresh];
  const merged = [
    ...all.filter((m) => !m.isPending).sort(compareMessages),
    ...all.filter((m) => m.isPending),
  ];
  return { messages: merged, evicted: 0 };
};

// Older page: prepended in full (no cap). `dropped` is always 0; kept for API compatibility.
export const mergeOlder = (current, incoming) => {
  const ids = new Set(current.map(idOf));
  const older = (incoming || []).filter((m) => !ids.has(idOf(m))).sort(compareMessages);
  return {
    messages: older.length ? [...older, ...current] : current,
    dropped: 0,
  };
};

export const applyNewerMessages = ({
  messageCache, cacheKey, incoming, setMessages, isActive = () => true,
  transform = (x) => x, fallback = [],
}) => {
  const entry = messageCache.current[cacheKey];
  const { messages, evicted } = mergeNewer(entry?.messages ?? fallback, incoming);
  const finalMessages = transform(messages);
  const hasMore = (entry?.hasMore ?? false) || evicted > 0;
  messageCache.current[cacheKey] = { messages: finalMessages, hasMore, timestamp: Date.now() };
  if (isActive()) setMessages((prev) => transform(mergeNewer(prev, incoming).messages));
  return { messages: finalMessages, hasMore, evicted };
};
