import express from 'express';
import fetch from 'node-fetch'; // Assuming node-fetch is available or can be installed

const router = express.Router();

router.get('/search', async (req, res) => {
  const query = req.query.q;
  const pageToken = req.query.pageToken; // Get pageToken from query

  if (!query) {
    return res.status(400).json({ error: 'Missing q parameter' });
  }

  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    console.error('YOUTUBE_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server configuration error: YouTube API key missing.' });
  }

  try {
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${youtubeApiKey}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`; // Add pageToken if it exists
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('YouTube API error:', data.error);
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    const videos = data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.default.url,
      channelTitle: item.snippet.channelTitle
    }));

    res.json({ videos, nextPageToken: data.nextPageToken }); // Return nextPageToken
  } catch (error) {
    console.error('YouTube search failed:', error);
    res.status(500).json({ error: 'Failed to perform YouTube search.' });
  }
});

export default router;
