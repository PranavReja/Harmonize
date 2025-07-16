# Harmonize

This project contains a React frontend located in the `Harmonize/` directory and a Node.js/Express backend in `backend/`.

## Environment Variables

The backend requires a `.env` file inside the `backend/` directory with the following variables:

```
MONGO_URI=<MongoDB connection string>
PORT=<port number for the API server>
YOUTUBE_API_KEY=<YouTube API key>
SPOTIFY_CLIENT_ID=<Spotify client ID>
SPOTIFY_CLIENT_SECRET=<Spotify client secret>
SPOTIFY_REDIRECT_URI=<Spotify OAuth redirect URI>
SOUNDCLOUD_CLIENT_ID=<SoundCloud client ID>
```

The `.env` file is excluded from version control via the root `.gitignore`.
An example file `backend/.env.example` is provided to illustrate the expected
variables.

The React frontend also uses environment variables via Vite. Create a `.env` file
inside the `Harmonize/` directory containing:

```
VITE_YOUTUBE_API_KEY=<YouTube API key>
```

You can copy `Harmonize/.env.example` and fill in your keys.

The SoundCloud client ID is stored only on the backend. The React app retrieves it
by requesting `http://localhost:3001/config/soundcloud-client-id`.
