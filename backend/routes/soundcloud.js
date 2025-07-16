import express from 'express';

const router = express.Router();

router.get('/search', async (req, res) => {
  const query = req.query.q;
  const offset = parseInt(req.query.offset || '0', 10);
  if (!query) return res.status(400).json({ error: 'Missing q parameter' });
  try {
    const url =
      `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${process.env.SOUNDCLOUD_CLIENT_ID}` +
      `&limit=14&offset=${offset}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const tracks = (data.collection || []).map((item) => ({
      id: item.id?.toString() || '',
      title: item.title,
      artist: item.user?.username || '',
      thumbnail: item.artwork_url || item.user?.avatar_url || null,
      url: item.permalink_url,
    }));
    res.json({ tracks });
  } catch (err) {
    console.error('SoundCloud search error', err);
    res.status(500).json({ error: 'SoundCloud search failed' });
  }
});

export default router;
