import express from 'express';

let accessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  try {
    if (!accessToken || Date.now() >= tokenExpiresAt) {
      const creds = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        throw new Error('Spotify client ID or secret not set');
      }
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(creds).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
      if (!res.ok) {
        throw new Error(`Failed to get Spotify access token: ${res.statusText}`);
      }
      const data = await res.json();
      accessToken = data.access_token;
      tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // refresh 1m early
    }
    return accessToken;
  } catch (err) {
    console.error('Error getting Spotify access token:', err);
    throw err; // re-throw the error to be caught by the route handler
  }
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
      thumbnail: item.album.images?.[0]?.url || null,
      url: item.external_urls?.spotify,
      duration: item.duration_ms
    }));
    res.json({ tracks });
  } catch (err) {
    console.error('Spotify search error', err);
    res.status(500).json({ error: 'Spotify search failed' });
  }
});

router.get('/track/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const token = await getAccessToken();
    const resp = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    if (data.error) return res.status(400).json({ error: 'Track not found' });
    const thumbnail = data.album?.images?.[0]?.url || null;
    res.json({ thumbnail });
  } catch (err) {
    console.error('Spotify track error', err);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

export default router;