import express from 'express';

const router = express.Router();

router.get('/soundcloud-client-id', (req, res) => {
  const id = process.env.SOUNDCLOUD_CLIENT_ID;
  if (!id) {
    return res.status(500).json({ error: 'SoundCloud client ID not configured' });
  }
  res.json({ clientId: id });
});

export default router;
