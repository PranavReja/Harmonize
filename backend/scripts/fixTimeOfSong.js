import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from '../models/Room.js';

// Load environment variables from backend/.env
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const rooms = await Room.find();
  for (const room of rooms) {
    let updated = false;
    room.queue.forEach((item) => {
      if (item.timeOfSong === undefined) {
        item.timeOfSong = null;
        updated = true;
      }
    });
    if (updated) {
      await room.save();
      console.log(`Updated room ${room.roomId}`);
    }
  }
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
