import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

let soundcloudToken = null;

async function getSoundCloudAccessToken() {
  if (!process.env.SOUNDCLOUD_CLIENT_ID || !process.env.SOUNDCLOUD_CLIENT_SECRET) {
    console.error("Missing SoundCloud credentials in .env");
    return null;
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
      console.error(`Failed to obtain SoundCloud access token: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    soundcloudToken = data.access_token;
    return soundcloudToken;
  } catch (error) {
    console.error('Error fetching SoundCloud access token:', error);
    return null; 
  }
}

async function getSoundCloudDuration(id) {
  const token = await getSoundCloudAccessToken();
  if (!token) {
      console.log("No token obtained.");
      return null;
  }
  
  console.log("Got token:", token.substring(0, 10) + "...");
  console.log("Fetching track:", id);

  try {
    const resp = await fetch(`https://api.soundcloud.com/tracks/${id}`, {
        headers: { 
            'Authorization': `OAuth ${token}`,
            'User-Agent': 'Harmonize/1.0 (Node.js)'
        }
    });
    if (!resp.ok) {
        const txt = await resp.text();
        console.log("Fetch failed:", resp.status, txt);
        return null;
    }
    const data = await resp.json();
    console.log("Got data. Duration (ms):", data.duration);
    return Math.round((data.duration || 0) / 1000); // SC duration is in ms
  } catch (e) {
      console.error('SoundCloud duration fetch error:', e);
      return null;
  }
}

// Test with a known valid SoundCloud Track ID (replace with one from your search if needed)
// Example ID: 1973938703 (Drake - God's Plan, just a random one found online or search results)
// Use a real ID from your previous search tests if you have one.
// I'll use a dummy ID, but ideally I should use one that exists.
// If I can't get a real ID, I'll rely on the search endpoint to get one first.

async function test() {
    // 1. Search to get a valid ID
    const token = await getSoundCloudAccessToken();
    if(!token) return;

    const searchUrl = new URL('https://api.soundcloud.com/tracks');
    searchUrl.searchParams.append('q', 'drake');
    searchUrl.searchParams.append('limit', '1');
    
    const sRes = await fetch(searchUrl.toString(), {
        headers: { 'Authorization': `OAuth ${token}`, 'User-Agent': 'Harmonize/1.0 (Node.js)' }
    });
    const sData = await sRes.json();
    const track = Array.isArray(sData) ? sData[0] : sData.collection[0];
    
    if(!track) {
        console.log("Search returned no tracks to test with.");
        return;
    }
    
    console.log(`Testing with track: ${track.title} (ID: ${track.id})`);
    
    // 2. Test getDuration
    const duration = await getSoundCloudDuration(track.id);
    console.log("Final Duration (sec):", duration);
}

test();
