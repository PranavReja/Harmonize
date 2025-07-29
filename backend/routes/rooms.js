import express from 'express';      // Get the Express Router system
import Room from '../models/Room.js'; // Import your Room model
import User from '../models/User.js'; // Top of file
import crypto from 'crypto';         // Use this to generate random room IDs


const router = express.Router(); // Create a new router for /rooms endpoints


// POST /rooms/create
router.post('/create', async (req, res) => {
    const { mode: requestedMode, name } = req.body; // Get requested mode and room name
    const mode = requestedMode === 'spotify' ? 'spotify' : 'guest';

    // Generate a random 6-character room ID (like abc123)
    const roomId = crypto.randomBytes(3).toString('hex');

    // Make a new room based on schema
    const room = new Room({ roomId, mode, name });

    // Save the room to the MongoDB database
    await room.save();

    // Send back the room ID to the frontend
    res.json({ roomId, roomName: room.name });
  });
  

  // POST /rooms/:id/join (deprecated)
router.post('/:id/join', async (req, res) => {
    const roomId = req.params.id; // Get the room ID from the URL
    const room = await Room.findOne({ roomId }); // Look it up in the database

    if (!room) return res.status(404).json({ error: 'Room not found' }); // Error if not found

    // You could add logic here to track users in the room
    res.json({ message: 'Joined room', mode: room.mode, roomName: room.name }); // Send back confirmation
  });
  
  
// GET /rooms/:id/queue → returns the current queue for a room
router.get('/:id/queue', async (req, res) => {
    const roomId = req.params.id;
    const room = await Room.findOne({ roomId });
  
    if (!room) return res.status(404).json({ error: 'Room not found' });
  
    const sortedQueue = [...room.queue].sort((a, b) => a.position - b.position);
  
    res.json({ roomId: room.roomId, queue: sortedQueue });
  });

  router.post('/:id/queue', async (req, res) => {
    const roomId = req.params.id;
    const { title, artist, platform, sourceId, addedBy } = req.body;
  
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return res.status(404).json({ error: 'Room not found' });
  
      // Validate user
      const user = await User.findOne({ userId: addedBy });
      if (!user || user.currentRoom !== roomId) {
        return res.status(400).json({ error: 'User must be in the room to queue a song' });
      }
  
      // Block Spotify in guest rooms
      if (room.mode === 'guest' && platform === 'spotify') {
        return res.status(400).json({ error: 'Spotify songs are not allowed in guest mode' });
      }
  
      const newSong = {
        title,
        artist,
        platform,
        sourceId,
        addedBy,
        addedByName: user.username,
        position: room.queue.length
      };
  
      room.queue.push(newSong);
      await room.save();
  
      res.json({ message: 'Song added to queue', queue: room.queue });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  


  // PATCH /rooms/:id/queue/reorder
router.patch('/:id/queue/reorder', async (req, res) => {
    const roomId = req.params.id;
    const { sourceIndex, destinationIndex } = req.body;
  
    try {
      const room = await Room.findOne({ roomId });
  
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
  
      // Validate indices
      const queue = [...room.queue];
      if (
        sourceIndex < 0 || sourceIndex >= queue.length ||
        destinationIndex < 0 || destinationIndex >= queue.length
      ) {
        return res.status(400).json({ error: 'Invalid source or destination index' });
      }
  
      // Move the song
      const [movedSong] = queue.splice(sourceIndex, 1);
      queue.splice(destinationIndex, 0, movedSong);
  
      // Reassign positions
      const reorderedQueue = queue.map((song, index) => ({
        ...song.toObject(),  // Convert Mongoose doc to plain object
        position: index
      }));
  
      // Save new queue to room
      room.queue = reorderedQueue;
      await room.save();
  
      res.json({ message: 'Queue reordered', queue: room.queue });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // DELETE /rooms/:id/queue/:position
router.delete('/:id/queue/:position', async (req, res) => {
    const roomId = req.params.id;
    const position = parseInt(req.params.position);
  
    try {
      const room = await Room.findOne({ roomId });
  
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
  
      if (isNaN(position) || position < 0 || position >= room.queue.length) {
        return res.status(400).json({ error: 'Invalid song position' });
      }
  
      // Remove the song at the given position
      room.queue.splice(position, 1);
  
      // Recalculate positions for remaining songs
      room.queue = room.queue.map((song, index) => ({
        ...song.toObject(),
        position: index
      }));
  
      await room.save();
  
      res.json({ message: 'Song removed', queue: room.queue });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /rooms/:id → Deletes the entire room
router.delete('/:id', async (req, res) => {
    const roomId = req.params.id;
  
    try {
      const deletedRoom = await Room.findOneAndDelete({ roomId });
  
      if (!deletedRoom) {
        return res.status(404).json({ error: 'Room not found' });
      }
  
      res.json({ message: `Room ${roomId} deleted successfully.` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // DELETE /rooms → Deletes all rooms (for development use only)
router.delete('/', async (req, res) => {
    try {
      const result = await Room.deleteMany({});
      res.json({ message: 'All rooms deleted', deletedCount: result.deletedCount });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// PATCH /rooms/:id/join-user
router.patch('/:id/join-user', async (req, res) => {
  const { userId, username } = req.body;
  const roomId = req.params.id;

  const user = await User.findOne({ userId });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Leave previous room if needed
  if (user.currentRoom && user.currentRoom !== roomId) {
    const oldRoom = await Room.findOne({ roomId: user.currentRoom });
    if (oldRoom) {
      oldRoom.users = oldRoom.users.filter(u => u.userId !== userId);
      await oldRoom.save();
    }
  }

  // Join new room
  const room = await Room.findOne({ roomId });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const alreadyIn = room.users.find(u => u.userId === userId);
  if (!alreadyIn) {
    const isAdmin = room.users.length === 0;
    const newUser = { userId, username, isAdmin };
    if (isAdmin) {
      room.users.unshift(newUser);
    } else {
      room.users.push(newUser);
    }
    await room.save();
  }

  user.currentRoom = roomId;
  await user.save();

  res.json({ message: `User joined ${roomId}`, users: room.users });
});

// GET /rooms/:id/users → List users in a room with services
router.get('/:id/users', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.id });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const userIds = room.users.map(u => u.userId);
    const usersData = await User.find({ userId: { $in: userIds } });

    const servicesMap = {};
    usersData.forEach(u => {
      const connected = [];
      for (const [name, info] of Object.entries(u.services)) {
        if (info.connected) connected.push(name.charAt(0).toUpperCase() + name.slice(1));
      }
      servicesMap[u.userId] = connected;
    });

    const users = room.users.map(u => ({
      userId: u.userId,
      username: u.username,
      isAdmin: u.isAdmin,
      services: servicesMap[u.userId] || []
    }));

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch room users' });
  }
});

// PATCH /rooms/:id/remove-user
router.patch('/:id/remove-user', async (req, res) => {
  const { userId } = req.body;
  const room = await Room.findOne({ roomId: req.params.id });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  room.users = room.users.filter(u => u.userId !== userId);
  await room.save();

  const user = await User.findOne({ userId });
  if (user) {
    user.currentRoom = null;
    await user.save();
  }

  res.json({ message: 'User removed from room', users: room.users });
});

router.post('/:id/queue/next', async (req, res) => {
  const roomId = req.params.id;
  const { title, artist, platform, sourceId, addedBy } = req.body;

  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const user = await User.findOne({ userId: addedBy });
    if (!user || user.currentRoom !== roomId) {
      return res.status(400).json({ error: 'User must be in the room to queue a song' });
    }

    if (room.mode === 'guest' && platform === 'spotify') {
      return res.status(400).json({ error: 'Spotify songs are not allowed in guest mode' });
    }

    const insertIndex = room.currentIndex + 1 || 0;

    room.queue.splice(insertIndex, 0, {
      title,
      artist,
      platform,
      sourceId,
      addedBy,
      addedByName: user.username,
      position: insertIndex
    });

    // Reassign all positions after inserting
    room.queue = room.queue.map((song, i) => ({
      ...song.toObject(),
      position: i
    }));

    await room.save();
    res.json({ message: 'Song added to play next', queue: room.queue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



  
export default router;