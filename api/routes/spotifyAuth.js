import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Redirect user to Spotify authorization
router.get('/login', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).send('Missing userId');
  const scope = 'user-read-private user-read-email streaming';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID || '',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || '',
    scope,
    state: userId
  });
  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
  console.log('Redirecting to:', url);
  res.redirect(url);
});

// Callback after Spotify authorization
router.get('/callback', async (req, res) => {
  console.log('Spotify callback received');
  const { code, state } = req.query;
  if (!code || !state) {
    console.log('Missing code or state');
    return res.status(400).send('Missing code or state');
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI || '',
      client_id: process.env.SPOTIFY_CLIENT_ID || '',
      client_secret: process.env.SPOTIFY_CLIENT_SECRET || ''
    });
    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const data = await resp.json();
    console.log('Spotify token response:', data);
    if (!resp.ok) {
      console.error('Spotify token error', data);
      return res.status(400).send('Failed to obtain tokens');
    }
    const expiresAt = new Date(Date.now() + (data.expires_in || 0) * 1000);
    await User.findOneAndUpdate(
      { userId: state },
      {
        'services.spotify.accessToken': data.access_token,
        'services.spotify.refreshToken': data.refresh_token,
        'services.spotify.expiresAt': expiresAt,
        'services.spotify.connected': true
      }
    );
    console.log('Spotify account linked successfully');
    res.send('Spotify account linked. You can close this window.');
  } catch (err) {
    console.error('Spotify callback error', err);
    res.status(500).send('Server error');
  }
});

router.get('/token/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const user = await User.findOne({ userId });
    if (!user || !user.services?.spotify?.connected) {
      return res.status(404).json({ error: 'Spotify not connected for user' });
    }

    let { accessToken, refreshToken, expiresAt } = user.services.spotify;

    if (new Date() >= expiresAt) {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.SPOTIFY_CLIENT_ID || '',
        client_secret: process.env.SPOTIFY_CLIENT_SECRET || ''
      });
      const resp = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error('Spotify refresh token error', data);
        return res.status(400).json({ error: 'Failed to refresh token' });
      }
      const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);
      user.services.spotify.accessToken = data.access_token;
      user.services.spotify.expiresAt = newExpiresAt;
      if (data.refresh_token) {
        user.services.spotify.refreshToken = data.refresh_token;
      }
      await user.save();
      accessToken = data.access_token;
    }
    res.json({ accessToken });
  } catch (err) {
    console.error('Spotify token fetch error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
