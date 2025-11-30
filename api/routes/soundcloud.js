import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

let accessToken = null;
let tokenExpiresAt = null;

const getAccessToken = async () => {
  // Check for environment variables
  if (!process.env.SOUNDCLOUD_CLIENT_ID || !process.env.SOUNDCLOUD_CLIENT_SECRET) {
    console.error("Missing SoundCloud credentials in .env");
    throw new Error('Missing SOUNDCLOUD_CLIENT_ID or SOUNDCLOUD_CLIENT_SECRET');
  }

  if (accessToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    return accessToken;
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', process.env.SOUNDCLOUD_CLIENT_ID);
    params.append('client_secret', process.env.SOUNDCLOUD_CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');

    const response = await fetch('https://api.soundcloud.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Harmonize/1.0 (Node.js)' 
      },
      body: params,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('SoundCloud Token Error:', response.status, errorText);
        throw new Error(`Failed to obtain access token: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiresAt = new Date(Date.now() + (data.expires_in - 300) * 1000);
    
    return accessToken;
  } catch (error) {
    console.error('Error fetching SoundCloud access token:', error);
    throw error;
  }
};

router.get('/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const token = await getAccessToken();
    
    const limit = req.query.limit || '10';
    const offset = req.query.offset || '0';
    
    const searchUrl = new URL('https://api.soundcloud.com/tracks');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('limit', limit); 
    searchUrl.searchParams.append('offset', offset);
    // searchUrl.searchParams.append('access', 'playable'); // Optional

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `OAuth ${token}`,
        'User-Agent': 'Harmonize/1.0 (Node.js)'
      }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`SoundCloud Search Error (${response.status}):`, errorText);
        return res.status(response.status).json({ 
            error: 'SoundCloud API error',
            details: errorText
        });
    }

    const data = await response.json();
    
    const tracks = Array.isArray(data) ? data : (data.collection || []);

    const mappedTracks = tracks.map(track => ({
      id: String(track.id),
      title: track.title,
      artist: track.user ? track.user.username : 'Unknown Artist',
      thumbnail: track.artwork_url || (track.user ? track.user.avatar_url : '') || 'https://a-v2.sndcdn.com/assets/images/default_artwork_large-577c008.png',
      url: track.permalink_url,
      duration: track.duration, 
      source: 'soundcloud'
    }));

    res.json(mappedTracks);

  } catch (error) {
    console.error('SoundCloud search route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;