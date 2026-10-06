const LOG = true; // console.log every response
const REST_URL = 'https://gatherup-now-loadbalancer-service.onrender.com/api';

/* ───────────────────────── token storage ───────────────────────── */
let memToken = null;
const store = {
  get: () => (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : memToken),
  set: (t) => (typeof localStorage !== 'undefined' ? localStorage.setItem('token', t) : (memToken = t)),
  clear: () => (typeof localStorage !== 'undefined' ? localStorage.removeItem('token') : (memToken = null)),
};

/* ───────────────────────── fetch client ───────────────────────── */
const qs = (params) => {
  if (!params) return '';
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) u.set(k, v);
  const str = u.toString();
  return str ? `?${str}` : '';
};

async function request(method, path, { params, body, signal } = {}) {
  const headers = {};
  const token = store.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(REST_URL + path + qs(params), {
    method,
    headers,
    credentials: 'include',
    signal,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  const ct = res.headers.get('content-type') || '';
  const payload = ct.includes('application/json') ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    if (res.status === 498) store.clear(); // token expired/invalid
    const err = new Error(payload?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = payload;
    throw err;
  }
  if (LOG) console.log(`[${method}] ${path}${qs(params)} → ${res.status}`, payload);
  return payload;
}

export const http = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
};

/* ───────────────────────── RSA key pair (same format as the app) ───────────────────────── */
const pem = (buf, label) => {
  let bin = '';
  new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
  return `-----BEGIN ${label}-----\n${btoa(bin).match(/.{1,64}/g).join('\n')}\n-----END ${label}-----`;
};

export async function makeKeys() {
  const { subtle } = globalThis.crypto;
  const k = await subtle.generateKey(
    { name: 'RSA-OAEP', hash: 'SHA-256', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ['encrypt', 'decrypt']
  );
  return {
    publicKeyPem: pem(await subtle.exportKey('spki', k.publicKey), 'PUBLIC KEY'),
    privateKeyPem: pem(await subtle.exportKey('pkcs8', k.privateKey), 'PRIVATE KEY'),
  };
}

/* ───────────────────────── AUTH  /auth ───────────────────────── */
export const auth = {
  checkUsername: (username) => http.get('/auth/check-username', { params: { username } }),
  async login(credentials) {
    const d = await http.post('/auth/login', credentials);
    if (d?.token) store.set(d.token);
    return d;
  },
  async register(userData) {
    const d = await http.post('/auth/register', userData);
    if (d?.token) store.set(d.token);
    return d;
  },
  /** guest({ username, gender }) — gender: 0 | 1 | 2. Generates keys unless publicKey is passed. */
  async guest({ username, gender = 0, publicKey } = {}) {
    let keys = null;
    if (!publicKey) {
      keys = await makeKeys();
      publicKey = keys.publicKeyPem;
    }
    const d = await http.post('/auth/guest', { username, gender, publicKey });
    if (d?.token) store.set(d.token);
    return keys ? { ...d, privateKeyPem: keys.privateKeyPem } : d;
  },
  async logout() {
    await http.post('/auth/logout');
    store.clear();
  },
};

/* ───────────────────────── USERS  /users ───────────────────────── */
export const users = {
  getProfile: () => http.get('/users/profile'),
  updateProfile: (profile) => http.put('/users/profile', profile),
  getUserProfile: (userId) => http.get(`/users/${userId}/profile`).then((d) => d?.user),
  getActivityStatus: (userId) =>
    (http.get('/users/activity-status', { params: { userId } })).then((d) => d?.data),
  search: (q, limit = 5) => http.get('/users/search', { params: { q, limit } }),
  remove: (userId) => http.delete(`/users/${userId}`),
};

/* ───────────────────────── ROOMS  /rooms ───────────────────────── */
export const rooms = {
  list: (search = '', page = 0, limit = 20) =>
    (http.get('/rooms', { params: { search, skip: page * limit, limit } })),
  joined: () => http.get('/rooms/joined'),
  unread: () => http.get('/rooms/unread').catch(() => ({})),
  create: ({ groupName, groupDescription, publicKey, privateKey }) =>
    (http.post('/rooms/create', { groupName, groupDescription, publicKey, privateKey })),
  join: (roomId, req) => http.post('/rooms/join', { roomId, req }),
  leave: (roomId) => http.post('/rooms/leave', { roomId }),
  members: (roomId, skip = 0, search = '', limit = 20) =>
    (http.get(`/rooms/${roomId}/members`, { params: { skip, limit, search } })),
  update: (roomId, roomData) => http.put(`/rooms/${roomId}`, roomData),
  remove: (roomId) => http.delete(`/rooms/${roomId}`),
};

/* ───────────────────────── MESSAGES  /messages ───────────────────────── */
const page = (limit, before, after) => {
  const p = { limit };
  if (before) p.before = before;
  if (after) p.after = after;
  return p;
};

export const messages = {
  sendRoom: ({ roomId, message, media, uuid, replyTo, taggedUser, iv, wrappedKey }) =>
    http.post('/messages/send', {
      roomId,
      message,
      iv,
      wrappedKey,
      media: media ? { url: media.url, type: media.type } : null,
      uuid,
      replyTo: replyTo || null,
      taggedUser: taggedUser || null,
    }),

  sendPrivate: ({
    receiverId, content, receiverModel = 'User', media, uuid, replyTo, taggedUser,
    isSystemMessage, systemType, iv, senderKeyWrapped, receiverKeyWrapped,
  }) =>
    http.post('/messages/private/send', {
      receiverId,
      receiverModel,
      content,
      iv,
      senderKeyWrapped,
      receiverKeyWrapped,
      media: media ? { url: media.url, type: media.type } : null,
      uuid,
      replyTo: replyTo || null,
      taggedUser: taggedUser || null,
      ...(isSystemMessage && { isSystemMessage: true, systemType }),
    }),

  room: (roomId, limit = 20, before = null, after = null) =>
    (http.get(`/messages/room/${roomId}`, { params: page(limit, before, after) })),
  private: (otherUserId, limit = 20, before = null, after = null) =>
    (http.get(`/messages/private/${otherUserId}`, { params: page(limit, before, after) })),
  privateChats: () => http.get('/messages/private'),
  lastSeen: (otherUserId) => http.get(`/messages/private/${otherUserId}/last-seen`),
  deletePrivateChat: (otherUserId) => http.delete(`/messages/private/${otherUserId}`),
  uploadSignature: (folder = 'data') => http.get('/messages/upload-signature', { params: { folder } }),
};

/* ───────────────────────── MEDIA  /media ───────────────────────── */
export const media = {
  /** kind: 'stickers' | 'gifs'. Omit q for trending. */
  fetch: (kind, { q, page = 1, perPage = 12 } = {}) =>
    http.get(`/media/${kind}/${q ? 'search' : 'trending'}`, {
      params: q ? { q, page, per_page: perPage } : { page, per_page: perPage },
    }),
  stickers: (opts) => media.fetch('stickers', opts),
  gifs: (opts) => media.fetch('gifs', opts),
};

/* ───────────────────────── CLOUDINARY upload ─────────────────────────
   1) GET /messages/upload-signature  2) POST signed form to Cloudinary */
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB, same as the app

export async function uploadFile(file, { folder = 'data' } = {}) {
  if (file.size > MAX_FILE_SIZE) throw new Error('File size exceeds 8MB limit');

  const { signature, timestamp, api_key, cloud_name, folder: targetFolder } =
    await messages.uploadSignature(folder);

  const mime = file.type || '';
  const resourceType = mime.startsWith('video/') || mime.startsWith('audio/') ? 'video' : 'image';
  const mediaType = mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : 'image';

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', api_key);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('folder', targetFolder);

  // fetch has no upload-progress events, so no onProgress here
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message || `Upload failed (${res.status})`);
  return { url: json.secure_url, type: mediaType };
}

/* ───────────────────────── bulk guests ─────────────────────────
   node gatherup-api.js guests 30
   Creates guests one at a time (gentle on the server), retries a taken username,
   stops early on repeated rate-limits, and saves everything to guests.json (Node). */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function createGuests(count = 30, { delayMs = 400, gender } = {}) {
  const created = [];
  const failed = [];
  let rateLimited = 0;

  for (let i = 1; i <= count; i++) {
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      const username = 'guest' + Math.floor(100000 + Math.random() * 900000);
      try {
        const keys = await makeKeys();
        // direct call so the global token is not overwritten by each guest
        const d = await http.post('/auth/guest', {
          username,
          gender: gender ?? i % 3,
          publicKey: keys.publicKeyPem,
        });
        created.push({
          username,
          userId: d?.user?._id || d?.user?.id,
          token: d?.token,
          privateKeyPem: keys.privateKeyPem,
        });
        console.log(`✔ ${i}/${count} ${username}`);
        done = true;
      } catch (e) {
        if (e.status === 429) {
          rateLimited++;
          console.log(`… rate limited, waiting 5s (${rateLimited})`);
          await sleep(5000);
          if (rateLimited >= 5) { failed.push({ i, error: 'too many rate limits, stopped' }); i = count + 1; break; }
        } else if (attempt === 3) {
          failed.push({ i, username, status: e.status, error: e.message });
          console.log(`✘ ${i}/${count} ${username} → ${e.status || ''} ${e.message}`);
        }
      }
    }
    await sleep(delayMs);
  }

  console.log(`\nCreated ${created.length}/${count}, failed ${failed.length}`);
  if (failed.length) console.log('Failures:', failed);

  if (typeof process !== 'undefined' && process.versions?.node && created.length) {
    const fs = await import('node:fs');
    fs.writeFileSync('guests.json', JSON.stringify(created, null, 2));
    console.log('Saved guests.json (contains tokens + private keys, keep it private)');
  }
  return { created, failed };
}

/* ───────────────────────── demo (node gatherup-api.js) ─────────────────────────
   Calls the main endpoints and prints the data each one returned.
   Logs in as a guest (random username), then hits the authenticated routes. */
const GUEST_NAME = 'guest' + Math.floor(Math.random() * 100000);

async function step(name, fn) {
  try {
    const out = await fn();
    console.log(`\n✔ ${name}`);
    return out;
  } catch (e) {
    console.log(`\n✘ ${name} → ${e.status || ''} ${e.message}`);
    if (e.data) console.log(e.data);
  }
}

export async function runDemo() {
  const results = {};
  results.username = await step('auth.checkUsername', () => auth.checkUsername('test'));
  results.guest = await step('auth.guest', () => auth.guest({ username: GUEST_NAME, gender: 0 }));
  results.profile = await step('users.getProfile', () => users.getProfile());
  results.rooms = await step('rooms.list', () => rooms.list('', 0, 5));
  results.joined = await step('rooms.joined', () => rooms.joined());
  results.unread = await step('rooms.unread', () => rooms.unread());
  results.privateChats = await step('messages.privateChats', () => messages.privateChats());
  results.stickers = await step('media.stickers', () => media.stickers());
  results.gifs = await step('media.gifs', () => media.gifs({ q: 'cat' }));

  const firstRoom = Array.isArray(results.joined) ? results.joined[0] : results.joined?.rooms?.[0];
  if (firstRoom?._id) {
    results.messages = await step('messages.room', () => messages.room(firstRoom._id, 5));
  }

  const shown = { ...results, guest: results.guest && { ...results.guest, privateKeyPem: '[hidden]' } };
  console.log('\n===== ALL RESULTS =====');
  console.dir(shown, { depth: null });
  return results;
}

// Auto-run only when executed directly with Node:
//   node gatherup-api.js            → demo
//   node gatherup-api.js guests 30  → create 30 guests
if (typeof process !== 'undefined' && process.argv?.[1] &&
    import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  if (process.argv[2] === 'guests') createGuests(Number(process.argv[3]) || 30);
  else runDemo();
}

export default { makeKeys, auth, users, rooms, messages, media, uploadFile, http, runDemo, createGuests };