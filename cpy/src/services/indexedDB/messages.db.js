import { openDB, getStore, promisifyRequest, STORES, MAX_MESSAGES_PER_CHAT } from './core.js';

const _enforceCapInTransaction = (msgStore, metaStore, chatKey, currentCount) => {
  const excess = currentCount - MAX_MESSAGES_PER_CHAT;
  if (excess <= 0) return;

  const range = IDBKeyRange.bound([chatKey, ''], [chatKey, '\uffff']);
  const index = msgStore.index('chatKey_timestamp');
  let deleted = 0;

  const cursorReq = index.openCursor(range);
  cursorReq.onsuccess = (e) => {
    const cursor = e.target.result;
    if (!cursor || deleted >= excess) return;
    msgStore.delete(cursor.value.id);
    deleted++;
    cursor.continue();
  };

  const metaGet = metaStore.get(chatKey);
  metaGet.onsuccess = () => {
    const meta = metaGet.result;
    if (meta) {
      metaStore.put({ ...meta, count: Math.max(0, meta.count - excess) });
    }
  };
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
    if (!messages.length) return;
    try {
      const db = await openDB();
      const tx = db.transaction([STORES.messages, STORES.chatMeta], 'readwrite');
      const msgStore = tx.objectStore(STORES.messages);
      const metaStore = tx.objectStore(STORES.chatMeta);

      const index = msgStore.index('chatKey');
      const cursorReq = index.openCursor(IDBKeyRange.only(chatKey));
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { msgStore.delete(cursor.value.id); cursor.continue(); }
      };

      const toSave = messages.slice(-MAX_MESSAGES_PER_CHAT);
      toSave.forEach(msg => msgStore.put({ ...msg, chatKey }));

      const latestTimestamp = toSave[toSave.length - 1]?.timestamp ?? null;
      metaStore.put({ chatKey, latestTimestamp, hasMore, count: toSave.length });
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  },

  async mergeNewMessages(chatKey, newMessages) {
    if (!newMessages.length) return;
    try {
      const db = await openDB();
      const tx = db.transaction([STORES.messages, STORES.chatMeta], 'readwrite');
      const msgStore = tx.objectStore(STORES.messages);
      const metaStore = tx.objectStore(STORES.chatMeta);

      newMessages.forEach(msg => msgStore.put({ ...msg, chatKey }));

      const metaReq = metaStore.get(chatKey);
      metaReq.onsuccess = () => {
        const meta = metaReq.result ?? { chatKey, count: 0, hasMore: false, latestTimestamp: null };
        const newCount = meta.count + newMessages.length;
        const latestTimestamp = newMessages[newMessages.length - 1]?.timestamp ?? meta.latestTimestamp;

        if (newCount > MAX_MESSAGES_PER_CHAT) {
          _enforceCapInTransaction(msgStore, metaStore, chatKey, newCount);
        }

        metaStore.put({
          ...meta,
          latestTimestamp,
          count: Math.min(newCount, MAX_MESSAGES_PER_CHAT),
        });
      };
    } catch (error) {
      console.error('Error merging new messages:', error);
    }
  },

  async getMessages(chatKey) {
    try {
      const db = await openDB();
      const tx = db.transaction([STORES.messages, STORES.chatMeta], 'readonly');
      const msgStore = tx.objectStore(STORES.messages);
      const metaStore = tx.objectStore(STORES.chatMeta);

      const [msgs, meta] = await Promise.all([
        promisifyRequest(msgStore.index('chatKey').getAll(chatKey)),
        promisifyRequest(metaStore.get(chatKey)),
      ]);

      const sorted = (msgs || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return {
        messages: sorted,
        hasMore: meta?.hasMore ?? false,
        latestTimestamp: meta?.latestTimestamp ?? null,
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { messages: [], hasMore: false, latestTimestamp: null };
    }
  },

  async addMessage(chatKey, message) {
    if (!message?.id) return;
    try {
      const db = await openDB();
      const tx = db.transaction([STORES.messages, STORES.chatMeta], 'readwrite');
      const msgStore = tx.objectStore(STORES.messages);
      const metaStore = tx.objectStore(STORES.chatMeta);

      const existing = await promisifyRequest(msgStore.get(message.id));
      msgStore.put({ ...message, chatKey });

      if (!existing) {
        const metaReq = metaStore.get(chatKey);
        metaReq.onsuccess = () => {
          const meta = metaReq.result ?? { chatKey, count: 0, hasMore: false, latestTimestamp: null };
          const newCount = meta.count + 1;
          const msgTs = message.timestamp;
          const latestTimestamp =
            !meta.latestTimestamp || msgTs > meta.latestTimestamp
              ? msgTs
              : meta.latestTimestamp;

          if (newCount > MAX_MESSAGES_PER_CHAT) {
            _enforceCapInTransaction(msgStore, metaStore, chatKey, newCount);
          }

          metaStore.put({
            ...meta,
            latestTimestamp,
            count: Math.min(newCount, MAX_MESSAGES_PER_CHAT),
          });
        };
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
  },

  async deleteMessages(chatKey) {
    try {
      const db = await openDB();
      const tx = db.transaction([STORES.messages, STORES.chatMeta], 'readwrite');
      const msgStore = tx.objectStore(STORES.messages);
      const metaStore = tx.objectStore(STORES.chatMeta);

      const index = msgStore.index('chatKey');
      const cursorReq = index.openCursor(IDBKeyRange.only(chatKey));
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { msgStore.delete(cursor.value.id); cursor.continue(); }
      };
      metaStore.delete(chatKey);
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  }
};