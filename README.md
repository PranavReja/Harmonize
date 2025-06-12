# Harmonize

This project contains a React frontend located in the `Harmonize/` directory and a Node.js/Express backend in `backend/`.

## Environment Variables

The backend requires a `.env` file inside the `backend/` directory with the following variables:

```
MONGO_URI=<MongoDB connection string>
PORT=<port number for the API server>
YOUTUBE_API_KEY=<YouTube API key>
```

The `.env` file is excluded from version control via the root `.gitignore`.
An example file `backend/.env.example` is provided to illustrate the expected
variables.
