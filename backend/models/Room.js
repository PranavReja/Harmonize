import mongoose from 'mongoose'; // Get access to Mongoose

// Define what a "Room" should look like in the database
const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true }, // Short ID (e.g., abc123)
  name: { type: String, required: true }, // Human friendly room name
  mode: { type: String, enum: ['guest', 'spotify'], required: true }, // Type of room
  createdAt: { type: Date, default: Date.now }, // Auto-record when the room was created
  users: [
    {
      userId: String,
      username: String
    }
  ], // Optional list of users (can be expanded later)
  queue: [
    {
      title: String,
      artist: String,
      platform: String,     // 'spotify', 'youtube', 'soundcloud'
      sourceId: String,     // Spotify URI, YouTube video ID, etc.
      addedBy: String,       // username or user ID
      position: Number
    }
]
});


// Export this model so we can use it in our routes
export default mongoose.model('Room', RoomSchema);
