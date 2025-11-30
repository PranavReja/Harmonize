# Harmonize

Harmonize is a collaborative queue management platform designed to democratize the "aux cord." It allows a host (the Admin) to play music from various platforms while inviting others to join a room and collaboratively manage the playlist.

**The core concept:** One person listens (the Admin), and everyone else controls what plays next.

This makes Harmonize perfect for:
*   **Road Trips:** The driver or navigator connects their phone to the car stereo, while passengers use their own phones to add songs to the queue without passing a single device around.
*   **Parties:** The host runs the audio, but guests can request songs from their own devices.
*   **Streamers:** A unified way for chat/audience members to suggest songs.

## Features

-   **Centralized Playback:** The Admin acts as the sole audio output source, playing tracks seamlessly from YouTube, Spotify, and SoundCloud.
-   **Collaborative Queue:** joined users can search for songs, add them to the shared queue, and see what's coming up next.
-   **Real-Time Updates:** While audio plays only for the Admin, all users see the "Now Playing" status, progress bar, and queue updates in real-time.
-   **Multi-Platform Support:** Queue tracks from multiple services (YouTube, Spotify, SoundCloud) into a single, unified playlist.
-   **Room Management:** Easy-to-share invite links for quick room entry.
-   **Admin Controls:** The host has full control over playback (play/pause/skip) and queue management (removing songs, reordering).

## Tech Stack

Harmonize is built using a modern full-stack architecture:

-   **Frontend:** Built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for a fast and responsive user interface.
-   **Backend:** A RESTful API built with [Node.js](https://nodejs.org/) and [Express](https://expressjs.com/).
-   **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) is used for persistent storage of room states, queues, and user data.

## Architecture & Deployment

Although the frontend and backend code reside in the same repository, they are designed to run as separate services.

-   **Frontend (`/Harmonize`):** Hosted as a static site or web service.
-   **Backend (`/api`):** Hosted as a separate web service.

The project is currently deployed on **Render**, utilizing two separate instances:
1.  **Frontend Instance:** Serves the React application.
2.  **Backend Instance:** Hosts the Express API, which connects to a **MongoDB Atlas** cluster.

## Project Structure

```
Harmonize/
├── api/              # Backend (Node.js + Express)
│   ├── models/       # Mongoose models (Room, User)
│   ├── routes/       # API routes (Spotify, YouTube, Rooms, etc.)
│   └── index.js      # Entry point
├── Harmonize/        # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/  # UI Components
│   │   ├── assets/      # Images and icons
│   │   └── App.jsx      # Main application logic
│   └── ...
└── README.md         # Project documentation
```

## Getting Started

To run the project locally, you will need to set up both the frontend and the backend.

### Prerequisites

-   Node.js (v14 or higher)
-   npm or yarn
-   A MongoDB instance (local or Atlas)
-   API Keys for YouTube Data API, Spotify Web API, and SoundCloud.

### Backend Setup

1.  Navigate to the `api` directory:
    ```bash
    cd api
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on `.env.example` and fill in your credentials:
    ```env
    MONGO_URI=your_mongodb_connection_string
    PORT=3001
    YOUTUBE_API_KEY=your_youtube_key
    SPOTIFY_CLIENT_ID=your_spotify_id
    SPOTIFY_CLIENT_SECRET=your_spotify_secret
    SPOTIFY_REDIRECT_URI=http://localhost:5173/
    ```
4.  Start the server:
    ```bash
    npm start
    ```

### Frontend Setup

1.  Navigate to the `Harmonize` directory:
    ```bash
    cd Harmonize
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file (or set environment variables) to point to your local backend:
    ```env
    VITE_API_URL=http://localhost:3001
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:5173`.

## License

This project is open source and available under the [MIT License](LICENSE).
