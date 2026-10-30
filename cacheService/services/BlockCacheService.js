import UserIp from '../models/userIp.model.js';
import Block from '../models/block.model.js';
import RoomBlock from '../models/roomBlock.model.js';
import Ban from '../models/ban.model.js';

const TTL_MS = 30 * 1000;
const SWEEP_INTERVAL_MS = 60 * 1000;

const store = new Map();
const pending = new Map();

function getEntry(key) {
  const e = store.get(key);
  if (!e) return null;
  if (e.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return e.value;
}

function putEntry(key, value) {
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

async function load(key, loader) {
  const hit = getEntry(key);
  if (hit) return hit;
  if (pending.has(key)) return pending.get(key);
  const p = (async () => {
    try {
      const value = await loader();
      putEntry(key, value);
      return value;
    } finally {
      pending.delete(key);
    }
  })();
  pending.set(key, p);
  return p;
}

const loadUserBlocks = (blockerId) =>
  load(`user:${blockerId}`, async () => {
    const docs = await Block.find({ blockerId }, 'blockedId blockedUsername ips').lean();
    return new Map(docs.map(d => [d.blockedId, { username: d.blockedUsername, ips: d.ips || [] }]));
  });

const loadRoomBlocks = (roomId) =>
  load(`room:${roomId}`, async () => {
    const docs = await RoomBlock.find({ roomId }, 'userId username ips').lean();
    return new Map(docs.map(d => [d.userId, { username: d.username, ips: d.ips || [] }]));
  });

async function getUserIps(userId) {
  const id = String(userId);
  return load(`ips:${id}`, async () => {
    const docs = await UserIp.find({ 'users.userId': id }, 'ip').lean();
    return docs.map(d => d.ip);
  });
}

function matchesIp(blocks, ipSet) {
  for (const b of blocks.values()) {
    for (const ip of b.ips) if (ipSet.has(ip)) return true;
  }
  return false;
}

async function senderIpSet(senderId, senderIp) {
  const ips = new Set(await getUserIps(senderId));
  if (senderIp) ips.add(senderIp);
  return ips;
}

async function isBlockedPrivate(senderId, receiverId, senderIp) {
  const s = String(senderId);
  const r = String(receiverId);
  const [receiverBlocks, senderBlocks] = await Promise.all([loadUserBlocks(r), loadUserBlocks(s)]);

  if (receiverBlocks.has(s) || senderBlocks.has(r)) return true;
  if (receiverBlocks.size === 0) return false;
  return matchesIp(receiverBlocks, await senderIpSet(s, senderIp));
}

async function isBlockedBy(userId, peerId) {
  const blocks = await loadUserBlocks(String(peerId));
  return blocks.has(String(userId));
}

async function isBlockedInRoom(roomId, senderId, senderIp) {
  const s = String(senderId);
  const blocks = await loadRoomBlocks(String(roomId));
  if (blocks.size === 0) return false;
  if (blocks.has(s)) return true;
  return matchesIp(blocks, await senderIpSet(s, senderIp));
}

async function addUserBlock(blockerId, blockedId, username, ips = []) {
  const blocks = await loadUserBlocks(String(blockerId));
  blocks.set(String(blockedId), { username, ips });
  putEntry(`user:${blockerId}`, blocks);
}

async function removeUserBlock(blockerId, blockedId) {
  const blocks = await loadUserBlocks(String(blockerId));
  blocks.delete(String(blockedId));
  putEntry(`user:${blockerId}`, blocks);
}

async function addRoomBlock(roomId, userId, username, ips = []) {
  const blocks = await loadRoomBlocks(String(roomId));
  blocks.set(String(userId), { username, ips });
  putEntry(`room:${roomId}`, blocks);
}

async function removeRoomBlock(roomId, userId) {
  const blocks = await loadRoomBlocks(String(roomId));
  blocks.delete(String(userId));
  putEntry(`room:${roomId}`, blocks);
}

const toList = (blocks) => [...blocks].map(([userId, b]) => ({ userId, username: b.username }));
const listUserBlocks = async (blockerId) => toList(await loadUserBlocks(String(blockerId)));
const listRoomBlocks = async (roomId) => toList(await loadRoomBlocks(String(roomId)));

const loadBans = () =>
  load('bans:all', async () => {
    const docs = await Ban.find({}, 'userId username reason expiresAt').lean();
    return docs.map(d => ({
      userId: String(d.userId),
      username: d.username,
      reason: d.reason || '',
      expiresAt: d.expiresAt ? new Date(d.expiresAt).getTime() : null,
    }));
  });

const isActive = (ban) => !ban.expiresAt || ban.expiresAt > Date.now();

async function getBan(userId) {
  const id = userId ? String(userId) : null;
  if (!id) return null;
  const bans = await loadBans();
  for (const ban of bans) {
    if (!isActive(ban)) continue;
    if (ban.userId === id) return ban;
  }
  return null;
}

async function addBan({ userId, username, reason = '', expiresAt = null }) {
  const bans = await loadBans();
  const next = bans.filter(b => b.userId !== String(userId));
  next.push({
    userId: String(userId),
    username,
    reason,
    expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
  });
  putEntry('bans:all', next);
}

async function removeBan(userId) {
  const bans = await loadBans();
  putEntry('bans:all', bans.filter(b => b.userId !== String(userId)));
}

const listBans = async () => (await loadBans()).filter(isActive);

const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [k, e] of store) if (e.expiresAt <= now) store.delete(k);
}, SWEEP_INTERVAL_MS);
sweepTimer.unref?.();

export default {
  TTL_MS,
  getUserIps,
  isBlockedPrivate,
  isBlockedBy,
  isBlockedInRoom,
  addUserBlock,
  removeUserBlock,
  addRoomBlock,
  removeRoomBlock,
  listUserBlocks,
  listRoomBlocks,
  getBan,
  addBan,
  removeBan,
  listBans,
};
