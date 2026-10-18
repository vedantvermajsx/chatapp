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

export const capNewest = (list) =>
  list.length > MAX_MESSAGES ? list.slice(list.length - MAX_MESSAGES) : list;

export const withCap = (entry, list) => {
  const capped = capNewest(list);
  return {
    ...entry,
    messages: capped,
    hasMore: (entry?.hasMore ?? false) || capped.length < list.length,
  };
};

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
  const messages = capNewest(merged);
  return { messages, evicted: merged.length - messages.length };
};

export const mergeOlder = (current, incoming) => {
  const room = MAX_MESSAGES - current.length;
  if (room <= 0) return { messages: current, dropped: (incoming || []).length };
  const ids = new Set(current.map(idOf));
  const older = (incoming || []).filter((m) => !ids.has(idOf(m))).sort(compareMessages);
  const kept = older.slice(-room);
  return {
    messages: kept.length ? [...kept, ...current] : current,
    dropped: older.length - kept.length,
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
