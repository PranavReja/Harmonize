# Harmonize

Harmonize is a collaborative music listening platform that allows users to create and join rooms to listen to music together in real-time. Whether you're on YouTube, Spotify, or SoundCloud, Harmonize synchronizes playback across all connected users, ensuring everyone hears the same beat at the same time.

## Features

-   **Multi-Platform Support:** Seamlessly queue and play tracks from YouTube, Spotify, and SoundCloud.
-   **Real-Time Synchronization:** Playback, pausing, seeking, and track skipping are synchronized instantly for all users in the room.
-   **Collaborative Queue:** Users can add songs to a shared queue, reorder tracks, and see what's coming up next.
-   **Room Management:** Create private rooms, share invite links, and manage listeners.
-   **Admin Controls:** Room creators have administrative privileges to control playback and manage the room.
-   **Responsive UI:** A clean, modern interface with collapsible sidebars for room details and the queue, ensuring a great experience on various screen sizes.

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