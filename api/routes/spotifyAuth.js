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
    console.error('Spotify callback error:', error);
    return res.redirect(`${FRONTEND_URI}?error=spotify_auth_failed`);
  }

  if (!code || !userId) {
    return res.redirect(`${FRONTEND_URI}?error=invalid_callback`);
  }

  try {
    // Step 3: Exchange authorization code for access token
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
      console.error('Spotify Token Error:', tokenData);
      throw new Error(tokenData.error_description || 'Failed to fetch Spotify tokens.');
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Step 4: Save tokens to the user's record in the database
    await User.findOneAndUpdate(
      { userId: userId },
      {
        'services.spotify.accessToken': access_token,
        'services.spotify.refreshToken': refresh_token,
        'services.spotify.expiresAt': expiresAt,
        'services.spotify.connected': true,
      },
      { new: true, upsert: false } // upsert: false to not create a user if not found
    );

    // Step 5: Redirect back to the frontend application
    res.redirect(FRONTEND_URI);

  } catch (err) {
    console.error('Error during Spotify callback:', err);
    res.redirect(`${FRONTEND_URI}?error=internal_server_error`);
  }
});

export default router;