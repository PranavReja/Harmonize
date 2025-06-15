import express from 'express';

let accessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (!accessToken || Date.now() >= tokenExpiresAt) {
    const creds = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(creds).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const data = await res.json();
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // refresh 1m early
  }
  return accessToken;
}

const router = express.Router();

router.get('/search', async (req, res) => {
  const query = req.query.q;
  const offset = parseInt(req.query.offset || '0', 10);
  if (!query) {
    return res.status(400).json({ error: 'Missing q parameter' });
  }
  try {
    const token = await getAccessToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=14&offset=${offset}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await resp.json();
    const tracks = (data.tracks?.items || []).map((item) => ({
      id: item.id,
      title: item.name,
      artist: item.artists.map((a) => a.name).join(', '),
      thumbnail: item.album.images?.[item.album.images.length - 1]?.url || null,
      url: item.external_urls?.spotify
    }));
    res.json({ tracks });
  } catch (err) {
    console.error('Spotify search error', err);
    res.status(500).json({ error: 'Spotify search failed' });
  }
});

export default router;