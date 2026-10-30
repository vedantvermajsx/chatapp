import axios from 'axios';
import { getActiveBan } from '../../utils/block/getActiveBan.js';
import { getClientIp } from '../../utils/clientIp.js';

const EXPIRY_SECONDS = 6 * 60 * 60;
const REFRESH_AFTER_MS = 2 * 60 * 60 * 1000;
const PROPAGATE_MS = 3 * 60 * 1000;

let current = null; 
let next = null;
let creating = false;

async function createCredentialSet() {
  const domain = process.env.METERED_DOMAIN;
  const secretKey = process.env.METERED_SECRET_KEY;
  if (!domain || !secretKey) return null;

  const base = `https://${domain}/api/v1/turn`;
  const { data: cred } = await axios.post(
    `${base}/credential`,
    { expiryInSeconds: EXPIRY_SECONDS, label: 'gatherup' },
    { params: { secretKey }, timeout: 8000 }
  );
  const { data: servers } = await axios.get(`${base}/credentials`, {
    params: { apiKey: cred.apiKey },
    timeout: 8000,
  });
  if (!Array.isArray(servers) || !servers.length) throw new Error('empty ICE server list');
  return { servers, at: Date.now() };
}

function ensureFresh() {
  const now = Date.now();
  if (next && now - next.at > PROPAGATE_MS) {
    current = next;
    next = null;
  }
  const needNew = !current || (!next && now - current.at > REFRESH_AFTER_MS);
  if (needNew && !creating) {
    creating = true;
    createCredentialSet()
      .then((set) => {
        if (!set) return;
        if (!current) current = set;
        else next = set;
      })
      .catch((err) => console.error('[ice] could not create TURN credential:', err.response?.status || err.message))
      .finally(() => { creating = false; });
  }
}

ensureFresh();
setInterval(ensureFresh, 60 * 1000).unref?.();

export async function getIceServers(req, res) {
  if (getActiveBan(String(req.user._id), getClientIp(req))) {
    return res.status(403).json({ success: false, message: 'You are blocked from calls' });
  }
  ensureFresh();
  res.set('Cache-Control', 'no-store');
  return res.status(200).json({ iceServers: current?.servers || [] });
}
