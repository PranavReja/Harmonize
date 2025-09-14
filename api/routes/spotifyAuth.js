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
  console.log('Received request for /auth/spotify/login');
  const { userId } = req.query;
  if (!userId) {
    console.error('User ID is required for /login');
    return res.status(400).send('User ID is required');
  }
  console.log(`Generating Spotify auth URL for userId: ${userId}`);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state: userId, // Using state to pass the userId
  }).toString();

  console.log(`Redirecting user to: ${authUrl.toString()}`);
  res.redirect(authUrl.toString());
});

// Step 2: Spotify redirects back to this callback
router.get('/callback', async (req, res) => {
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log('SPOTIFY CALLBACK ROUTE WAS HIT');
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log('Reached /auth/spotify/callback');
  const { code, state: userId, error } = req.query;

  if (error) {
    console.error('Spotify callback returned an error:', error);
    return res.redirect(`${FRONTEND_URI}?error=spotify_auth_failed`);
  }

  if (!code || !userId) {
    console.error('Callback missing code or state (userId)');
    return res.redirect(`${FRONTEND_URI}?error=invalid_callback`);
  }
  
  console.log(`Callback successful for userId: ${userId}. Code received.`);

  try {
    console.log('Step 3: Exchanging authorization code for access token...');
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

    console.log('Successfully exchanged code for tokens.');
    const { access_token, refresh_token, expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    console.log(`Step 4: Saving tokens to database for userId: ${userId}`);
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

    console.log(`Successfully saved tokens for userId: ${userId}`);

    console.log('Step 5: Redirecting back to frontend application.');
    res.redirect(`${FRONTEND_URI}?userId=${userId}`);

  } catch (err) {
    console.error('A critical error occurred during the Spotify callback process:', err);
    res.redirect(`${FRONTEND_URI}?error=internal_server_error`);
  }
});

export default router;
