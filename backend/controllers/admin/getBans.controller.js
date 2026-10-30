import blockCacheClient from '../../database/blockCacheClient.js';

export async function getBans(req, res) {
  try {
    const bans = await blockCacheClient.listBans();
    res.json({ bans });
  } catch (err) {
    console.error('[admin/bans] error:', err.message);
    res.status(500).json({ message: 'Failed to load bans' });
  }
}
