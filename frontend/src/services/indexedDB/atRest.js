import { openDB, promisifyRequest, STORES, onStoresCleared } from './core.js';

const KEY_ID = 'atRestMessages';
let keyPromise = null;
onStoresCleared(() => { keyPromise = null; });

const getKey = () => {
  if (!keyPromise) {
    keyPromise = (async () => {
      const db = await openDB();
      const row = await promisifyRequest(
        db.transaction(STORES.keys, 'readonly').objectStore(STORES.keys).get(KEY_ID)
      );
      if (row?.key) return row.key;
      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      await promisifyRequest(
        db.transaction(STORES.keys, 'readwrite').objectStore(STORES.keys).put({ id: KEY_ID, key })
      );
      return key;
    })().catch((e) => { keyPromise = null; throw e; });
  }
  return keyPromise;
};

// Encrypts text fields (message text + reply preview text) with a non-extractable AES-GCM key.
export const sealMessage = async (msg) => {
  const { text, replyTo, ...rest } = msg;
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify({ text: text ?? null, replyText: replyTo?.text ?? null }));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const { text: _t, ...replyRest } = replyTo || {};
  return { ...rest, replyTo: replyTo ? replyRest : replyTo ?? null, _enc: { iv, ct } };
};

// Returns null if it cannot be decrypted (key cleared/changed).
export const openMessage = async (row) => {
  if (!row?._enc) return row;
  try {
    const key = await getKey();
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: row._enc.iv }, key, row._enc.ct);
    const { text, replyText } = JSON.parse(new TextDecoder().decode(plain));
    const { _enc, replyTo, ...rest } = row;
    return {
      ...rest,
      text,
      replyTo: replyTo ? { ...replyTo, text: replyText } : replyTo,
    };
  } catch {
    return null;
  }
};
