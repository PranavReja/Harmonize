import express from 'express';

const router = express.Router();

router.get('/search', async (req, res) => {
  const query = req.query.q;
  const offset = parseInt(req.query.offset, 10) || 0;
  if (!query) return res.status(400).json({ error: 'Missing q parameter' });
  try {
    const url = new URL('https://api-v2.soundcloud.com/search/tracks');
    url.searchParams.set('q', query);
    url.searchParams.set('client_id', process.env.SOUNDCLOUD_CLIENT_ID || '');
    url.searchParams.set('limit', '14');
    url.searchParams.set('offset', offset.toString());
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
