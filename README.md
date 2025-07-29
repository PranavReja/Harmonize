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
```

The `.env` file is excluded from version control via the root `.gitignore`.
An example file `backend/.env.example` is provided to illustrate the expected
variables.

## Migrating existing data

If upgrading from an earlier version, queue entries may not have a `timeOfSong` field.
Run the migration script to add this field:

```bash
node backend/scripts/fixTimeOfSong.js
```

This sets `timeOfSong` to `null` for any songs missing the field.
