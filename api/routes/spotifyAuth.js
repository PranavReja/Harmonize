import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Error: Code not found in query parameters.');
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirect_uri);

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64')
      },
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Spotify Token Error:', data);
      throw new Error(data.error_description || 'Failed to fetch Spotify tokens.');
    }

    const { access_token, refresh_token } = data;

    // Send a script to the popup window to send tokens to the parent window and close itself.
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({
              type: 'spotify-auth',
              accessToken: '${access_token}',
              refreshToken: '${refresh_token}'
            }, '*'); // Use a specific target origin in production for security
            window.close();
          </script>
          <p>Authentication successful! You can close this window.</p>
        </body>
      </html>
    `);

  } catch (error)
  {
    console.error('Error during Spotify callback:', error);
    res.status(500).send(`<html><body><h1>Error</h1><p>${error.message}</p></body></html>`);
  }
});

export default router;
