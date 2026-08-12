import axios from 'axios';

const KLIPY_API_KEY = process.env.KLIPY_API_KEY;

const BASE_BY_TYPE = {
  stickers: `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/stickers`,
  gifs: `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/gifs`,
};

const klipyClient = axios.create({ timeout: 8000 });

export const getStickers = async (req, res) => {
  try {
    if (!KLIPY_API_KEY) {
      return res.status(500).json({ message: 'Klipy API key is not configured' });
    }

    const { type } = req.params;
    const base = BASE_BY_TYPE[type];
    if (!base) {
      return res.status(400).json({ message: 'type must be "stickers" or "gifs"' });
    }

    const q = (req.query.q || '').trim();
    const page = parseInt(req.query.page, 10) || 1;
    const perPage = Math.min(parseInt(req.query.per_page, 10) || 12, 50);

    const url = q
      ? `${base}/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`
      : `${base}/trending?page=${page}&per_page=${perPage}`;

    const klipyRes = await klipyClient.get(url);

    return res.status(200).json(klipyRes.data);
  } catch (err) {
    console.error('[getStickers] error:', err.message);
    return res.status(502).json({ message: 'Failed to fetch from Klipy', error: err.message });
  }
};
