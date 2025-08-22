import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import roomsRouter from './routes/rooms.js';
import usersRouter from './routes/users.js';
import spotifyRouter from './routes/spotify.js';
import spotifyAuthRouter from './routes/spotifyAuth.js';
import resolveRouter from './routes/resolve.js';
import youtubeRouter from './routes/youtube.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/rooms', roomsRouter);
app.use('/api/users', usersRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/auth/spotify', spotifyAuthRouter);
app.use('/api/resolve', resolveRouter);
app.use('/api/youtube', youtubeRouter);
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error:", err));

// Routes


app.get('/test-db', async (req, res) => {
    try {
      const Room = mongoose.model('Room');
      const rooms = await Room.find(); // fetch all rooms
      res.json({ success: true, count: rooms.length, rooms });
    } catch (error) {
      console.error('MongoDB test error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  


app.listen(PORT, () => {
  console.log(`🚀 Backend listening at http://localhost:${PORT}`);
});


