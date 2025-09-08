import express from 'express';
import User from '../models/User.js';
import crypto from 'crypto';

const router = express.Router();

// Create a new user
router.post('/', async (req, res) => {
  const { username } = req.body;
  const userId = crypto.randomBytes(8).toString('hex');
  try {
    const user = new User({ userId, username });
    await user.save();
    res.status(201).json({ userId, username });
  } catch (err) {
    res.status(500).json({ error: 'User creation failed' });
  }
});


  
// GET /users/unjoined → List users not in any room
router.get('/unjoined', async (req, res) => {
    try {
      const users = await User.find({ currentRoom: null });
      res.json({ users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch unjoined users' });
    }
  });
  
  
  // GET /users/all → List all users
router.get('/all', async (req, res) => {
    try {
      const users = await User.find(); // No filter — get all users
      res.json({ users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
  
  // GET /users/in-room/:roomId → List users in a specific room
router.get('/in-room/:roomId', async (req, res) => {
    const { roomId } = req.params;
  
    try {
      const users = await User.find({ currentRoom: roomId });
      res.json({ users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch users in room' });
    }
  });
  
// Get user info
router.get('/:id', async (req, res) => {
    const user = await User.findOne({ userId: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      userId: user.userId,
      username: user.username,
      currentRoom: user.currentRoom,
      services: user.services
    });
  });
  
  
  // PATCH /users/:id → Update user info
  router.patch('/:id', async (req, res) => {
      const userId = req.params.id;
      const updates = req.body;
    
      try {
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ error: 'User not found' });
    
        // Update fields if present in body
        if (updates.username) user.username = updates.username;
        if (updates.currentRoom !== undefined) user.currentRoom = updates.currentRoom;
    
        // Optionally update connected services
        if (updates.services) {
          for (const service in updates.services) {
            if (!user.services[service]) {
              user.services[service] = {};
            }
            Object.assign(user.services[service], updates.services[service]);
          }
        }
    
        await user.save();
        res.json({ message: 'User updated', user });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
      }
    });


    // DELETE /users/:id → Delete a user and remove from room if applicable
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;
  
    try {
      const user = await User.findOne({ userId });
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      // Remove user from their current room if applicable
      if (user.currentRoom) {
        const room = await Room.findOne({ roomId: user.currentRoom });
        if (room) {
          room.users = room.users.filter(u => u.userId !== userId);
          await room.save();
        }
      }
  
      // Delete the user from the database
      await User.deleteOne({ userId });
  
      res.json({ message: `User ${userId} deleted successfully.` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });



// DELETE /users → Bulk delete all users (dev use only)
router.delete('/', async (req, res) => {
    try {
      const result = await User.deleteMany({});
      res.json({
        message: 'All users deleted successfully',
        deletedCount: result.deletedCount
      });
    } catch (err) {
      console.error('Bulk delete failed:', err);
      res.status(500).json({ error: 'Failed to delete all users' });
    }
  });
  
// Temporary route to get full user data for verification
router.get('/verify/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user); // Return the full user object
  } catch (err) {
    console.error('Error fetching user for verification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
