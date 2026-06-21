import Message from '../models/message.model.js';

const MAX_RESPONSE_BYTES = 25 * 1024;
const DB_BATCH_SIZE = 50;

function byteSize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

export async function paginateMessages({ query, limit, before, mapMessage = (m) => m }) {
  const cappedLimit = Math.max(1, parseInt(limit, 10) || 20);
  let cursor = before ? new Date(before) : null;

  let selected = [];
  let totalBytes = 0;
  let hasMore = false;

  while (selected.length < cappedLimit) {
    const dbQuery = cursor ? { ...query, timestamp: { $lt: cursor } } : { ...query };

    const batch = await Message.find(dbQuery)
      .sort({ timestamp: -1 })
      .limit(DB_BATCH_SIZE + 1)
      .lean();

    if (batch.length === 0) break;

    const batchHasExtra = batch.length > DB_BATCH_SIZE;
    if (batchHasExtra) batch.pop();

    let stoppedEarly = false;

    for (let i = 0; i < batch.length; i++) {
      const raw = batch[i];
      const mapped = mapMessage(raw);
      const size = byteSize(mapped);

      if (selected.length === 0 && size > MAX_RESPONSE_BYTES) {
        selected.push(mapped);
        cursor = raw.timestamp;
        hasMore = batchHasExtra || i < batch.length - 1;
        stoppedEarly = true;
        break;
      }

      if (totalBytes + size > MAX_RESPONSE_BYTES) {
        hasMore = true;
        stoppedEarly = true;
        break;
      }

      selected.push(mapped);
      totalBytes += size;
      cursor = raw.timestamp;

      if (selected.length >= cappedLimit) {
        hasMore = batchHasExtra || i < batch.length - 1;
        stoppedEarly = true;
        break;
      }
    }

    if (stoppedEarly) break;
    if (!batchHasExtra) break;
  }

  return {
    messages: selected,
    hasMore,
    nextCursor: cursor ? cursor.toISOString() : null,
  };
}

export async function fetchMessagesAfter({ query, limit, after, mapMessage = (m) => m }) {
  const cappedLimit = Math.max(1, parseInt(limit, 10) || 50);
  const afterDate = new Date(after);

  const dbQuery = { ...query, timestamp: { $gt: afterDate } };

  const batch = await Message.find(dbQuery)
    .sort({ timestamp: 1 })
    .limit(cappedLimit + 1)
    .lean();

  const hasMore = batch.length > cappedLimit;
  if (hasMore) batch.pop();

  let selected = [];
  let totalBytes = 0;

  for (const raw of batch) {
    const mapped = mapMessage(raw);
    const size = byteSize(mapped);
    if (totalBytes + size > MAX_RESPONSE_BYTES) break;
    selected.push(mapped);
    totalBytes += size;
  }

  return { messages: selected, hasMore: false };
}
