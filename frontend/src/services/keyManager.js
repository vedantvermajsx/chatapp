import { dbService } from './indexedDB.service.js';


let selfId = null;
let selfPrivateKey = null; 

const keyManager = {
  setSelfId(id) {
    selfId = id ? String(id) : null;
  },

  getSelfId() {
    return selfId;
  },

  async setSelfPrivateKey(userId, privateKeyPem) {
    if (!userId || !privateKeyPem) return;
    selfId = String(userId);
    await dbService.savePrivateKey(`self:${selfId}`, privateKeyPem);
    selfPrivateKey = privateKeyPem;
  },

  async loadSelfPrivateKey(userId) {
    if (!userId) return null;
    selfId = String(userId);
    if (selfPrivateKey) return selfPrivateKey;
    selfPrivateKey = await dbService.getPrivateKey(`self:${selfId}`);
    return selfPrivateKey;
  },

  async getSelfPrivateKey() {
    if (selfPrivateKey) return selfPrivateKey;
    if (!selfId) return null;
    return this.loadSelfPrivateKey(selfId);
  },



  async clear() {
    selfId = null;
    selfPrivateKey = null;
    try {
      await dbService.clearAllKeys();
    } catch (err) {
      console.error('[keyManager] clear error:', err.message);
    }
  },
};

export default keyManager;
