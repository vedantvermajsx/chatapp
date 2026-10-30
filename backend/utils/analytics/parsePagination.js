const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export function parsePagination(query = {}) {
  const page = Math.max(0, parseInt(query.page, 10) || 0);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  return { page, limit };
}
