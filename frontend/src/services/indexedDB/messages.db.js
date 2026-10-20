import { openDB, getStore, promisifyRequest, STORES, MAX_MESSAGES_PER_CHAT } from './core.js';
import { sealMessage, openMessage } from './atRest.js';
import { compareMessages, persistable } from '../../utils/messageList.js';

const runTx = async (fn) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.messages, STORES.chatMeta], 'readwrite');
    let result;
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    Promise.resolve(fn(tx.objectStore(STORES.messages), tx.objectStore(STORES.chatMeta)))
      .then((r) => { result = r; }, (err) => { try { tx.abort(); } catch {} reject(err); });
  });
};

const prepare = async (chatKey, messages) =>
  Promise.all(
    persistable(messages).map((m) => {
      const id = m.id || m._id;
      return sealMessage({ ...m, id, chatKey });
    })
  );

// Single owner of count / latestTimestamp / hasMore / eviction: derived from actual rows.
const reconcile = async (msgStore, metaStore, chatKey, hasMoreOverride) => {
  const rows = await promisifyRequest(msgStore.index('chatKey').getAll(chatKey));
  rows.sort(compareMessages);
  const excess = rows.length - MAX_MESSAGES_PER_CHAT;
  if (excess > 0) rows.splice(0, excess).forEach((r) => msgStore.delete(r.id));
  const meta = await promisifyRequest(metaStore.get(chatKey));
  metaStore.put({
    ...(meta ?? {}),
    chatKey,
    count: rows.length,
    latestTimestamp: rows.length ? rows[rows.length - 1].timestamp : null,
    hasMore: (hasMoreOverride ?? meta?.hasMore ?? false) || excess > 0,
  });
};

const upsert = async (chatKey, messages, hasMore) => {
  const sealed = await prepare(chatKey, messages);
  if (!sealed.length) return;
  try {
    await runTx(async (msgStore, metaStore) => {
      sealed.forEach((row) => msgStore.put(row));
      await reconcile(msgStore, metaStore, chatKey, hasMore);
    });
  } catch (error) {
    console.error('Error saving messages:', error);
  }
};

export const dbMessages = {
  async getLatestTimestamp(chatKey) {
    try {
      const store = await getStore(STORES.chatMeta);
      const meta = await promisifyRequest(store.get(chatKey));
      return meta?.latestTimestamp ?? null;
    } catch {
      return null;
    }
  },

  async getChatMeta(chatKey) {
    try {
      const store = await getStore(STORES.chatMeta);
      return promisifyRequest(store.get(chatKey));
    } catch {
      return null;
    }
  },

  async getScrollPosition(chatKey) {
    try {
      const store = await getStore(STORES.chatMeta);
      const meta = await promisifyRequest(store.get(chatKey));
      return meta?.scrollTop ?? null;
    } catch {
      return null;
    }
  },

  async saveScrollPosition(chatKey, scrollTop) {
    try {
      const store = await getStore(STORES.chatMeta, 'readwrite');
      const meta = await promisifyRequest(store.get(chatKey));
      store.put({ ...(meta ?? { chatKey, count: 0, hasMore: false, latestTimestamp: null }), chatKey, scrollTop });
    } catch (error) {
      console.error('Error saving scroll position:', error);
    }
  },

  async saveMessages(chatKey, messages, hasMore = false) {
    // The UI list may be far longer than the cache; only the newest MAX_MESSAGES_PER_CHAT are stored.
    const all = persistable(messages).sort(compareMessages);
    const list = all.length > MAX_MESSAGES_PER_CHAT ? all.slice(-MAX_MESSAGES_PER_CHAT) : all;
    if (list.length < all.length) hasMore = true;
    const sealed = await prepare(chatKey, list);
    if (!sealed.length) return;
    try {
      await runTx(async (msgStore, metaStore) => {
        const keys = await promisifyRequest(msgStore.index('chatKey').getAllKeys(chatKey));
        keys.forEach((k) => msgStore.delete(k));
        sealed.forEach((row) => msgStore.put(row));
        await reconcile(msgStore, metaStore, chatKey, hasMore);
      });
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  },

  // Upsert newer messages; evicts oldest beyond cap and sets hasMore=true when it does.
  mergeNewMessages(chatKey, newMessages, hasMore) {
    return upsert(chatKey, newMessages, hasMore);
  },

  // Upsert an older page (caller guarantees total stays within cap).
  mergeOlderMessages(chatKey, olderMessages, hasMore) {
    return upsert(chatKey, olderMessages, hasMore);
  },

  addMessage(chatKey, message) {
    return upsert(chatKey, [message]);
  },

  async getMessages(chatKey) {
    try {
      const db = await openDB();
      const tx = db.transaction([STORES.messages, STORES.chatMeta], 'readonly');
      const [rows, meta] = await Promise.all([
        promisifyRequest(tx.objectStore(STORES.messages).index('chatKey').getAll(chatKey)),
        promisifyRequest(tx.objectStore(STORES.chatMeta).get(chatKey)),
      ]);
      const opened = (await Promise.all((rows || []).map(openMessage))).filter(Boolean);
      opened.sort(compareMessages);
      return {
        messages: opened,
        hasMore: meta?.hasMore ?? false,
        latestTimestamp: meta?.latestTimestamp ?? null,
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { messages: [], hasMore: false, latestTimestamp: null };
    }
  },

  async removeMessage(chatKey, id) {
    if (!id) return;
    try {
      await runTx(async (msgStore, metaStore) => {
        msgStore.delete(id);
        await reconcile(msgStore, metaStore, chatKey);
      });
    } catch (error) {
      console.error('Error removing message:', error);
    }
  },

  async deleteMessages(chatKey) {
    try {
      await runTx(async (msgStore, metaStore) => {
        const keys = await promisifyRequest(msgStore.index('chatKey').getAllKeys(chatKey));
        keys.forEach((k) => msgStore.delete(k));
        metaStore.delete(chatKey);
      });
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  },
};
