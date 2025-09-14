import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const router = express.Router();

const scopes = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state'
].join(' ');

const FRONTEND_URI = process.env.FRONTEND_URI || 'https://harmonize-k4s6.onrender.com';

// Step 1: Redirect user to Spotify's authorization page
router.get('/login', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    console.error('User ID is required for /login');
    return res.status(400).send('User ID is required');
  }

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state: userId, // Using state to pass the userId
  }).toString();

  res.redirect(authUrl.toString());
});

// Step 2: Spotify redirects back to this callback
router.get('/callback', async (req, res) => {
  const { code, state: userId, error } = req.query;

  if (error) {
    console.error('Spotify callback returned an error:', error);
    return res.redirect(`${FRONTEND_URI}?error=spotify_auth_failed`);
  }

  if (!code || !userId) {
    console.error('Callback missing code or state (userId)');
    return res.redirect(`${FRONTEND_URI}?error=invalid_callback`);
  }

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Spotify API token exchange error:', tokenData);
      throw new Error(tokenData.error_description || 'Failed to fetch Spotify tokens.');
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      {
        'services.spotify.accessToken': access_token,
        'services.spotify.refreshToken': refresh_token,
        'services.spotify.expiresAt': expiresAt,
        'services.spotify.connected': true,
      },
      { new: true, upsert: false }
    );

    if (!updatedUser) {
      console.error(`User not found in database for userId: ${userId}. Tokens not saved.`);
      return res.redirect(`${FRONTEND_URI}?error=user_not_found`);
    }

    res.redirect(`${FRONTEND_URI}?userId=${userId}`);

  } catch (err) {
    console.error('A critical error occurred during the Spotify callback process:', err);
    res.redirect(`${FRONTEND_URI}?error=internal_server_error`);
  }
});

router.get('/refresh_token', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await User.findOne({ userId: userId });
    if (!user || !user.services.spotify.refreshToken) {
      return res.status(404).json({ error: 'User not found or no refresh token available' });
    }

    const refreshToken = user.services.spotify.refreshToken;
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Spotify API refresh token error:', tokenData);
      return res.status(tokenResponse.status).json({ error: tokenData.error_description || 'Failed to refresh Spotify token.' });
    }

    const { access_token, expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await User.findOneAndUpdate(
      { userId: userId },
      {
        'services.spotify.accessToken': access_token,
        'services.spotify.expiresAt': expiresAt,
      },
      { new: true }
    );

    res.json({
      accessToken: access_token,
      expiresIn: expires_in,
    });

  } catch (err) {
    console.error('Error refreshing Spotify token:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
