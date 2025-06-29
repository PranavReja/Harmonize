import express from 'express';
import dotenv from 'dotenv';

let accessToken = null;
let tokenExpiresAt = 0;

async function getSpotifyAccessToken() {
  if (!accessToken || Date.now() >= tokenExpiresAt) {
    const creds = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(creds).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // refresh 1m early
  }
  return accessToken;
}

dotenv.config();
const router = express.Router();

router.get('/', async (req, res) => {
  const link = req.query.link;
  if (!link) return res.status(400).json({ error: 'Missing link' });

  try {
    if (link.includes('youtube.com') || link.includes('youtu.be')) {
      const match = link.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:&|$)/);
      if (!match) return res.status(400).json({ error: 'Invalid YouTube link' });
      const videoId = match[1];
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`;
      const resp = await fetch(url);
      const data = await resp.json();
      const item = data.items && data.items[0];
      if (!item) return res.status(404).json({ error: 'Video not found' });
      const result = {
        service: 'YouTube',
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.default?.url || null,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
      return res.json(result);
    } else if (link.includes('spotify.com/track') || link.startsWith('spotify:track:')) {
      let id = null;
      const match = link.match(/track\/([0-9A-Za-z]+)/);
      if (match) id = match[1];
      if (link.startsWith('spotify:track:')) id = link.split(':')[2];
      if (!id) return res.status(400).json({ error: 'Invalid Spotify track link' });
      const token = await getSpotifyAccessToken();
      const resp = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (data.error) return res.status(400).json({ error: 'Spotify track not found' });
      const thumbnail = data.album?.images?.[data.album.images.length - 1]?.url || null;
      const result = {
        service: 'Spotify',
        title: data.name,
        artist: data.artists.map((a) => a.name).join(', '),
        thumbnail,
        url: data.external_urls?.spotify,
      };
      return res.json(result);
    } else {
      return res.status(400).json({ error: 'Unsupported link' });
    }
  } catch (err) {
    console.error('resolve error', err);
    res.status(500).json({ error: 'Failed to resolve link' });
  }
});

export default router;
