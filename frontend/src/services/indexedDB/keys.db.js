import { STORES, getStore, promisifyRequest } from './core.js';

export const dbKeys = {
  async savePrivateKey(id, privateKeyPem) {
    const store = await getStore(STORES.keys, 'readwrite');
    await promisifyRequest(store.put({ id, privateKeyPem }));
  },

  async getPrivateKey(id) {
    try {
      const store = await getStore(STORES.keys, 'readonly');
      const record = await promisifyRequest(store.get(id));
      return record?.privateKeyPem ?? null;
    } catch {
      return null;
    }
  },

  async deletePrivateKey(id) {
    const store = await getStore(STORES.keys, 'readwrite');
    await promisifyRequest(store.delete(id));
  },

  async clearAllKeys() {
    const store = await getStore(STORES.keys, 'readwrite');
    await promisifyRequest(store.clear());
  },
};
