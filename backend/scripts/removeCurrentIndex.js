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

  await Room.updateMany({}, { $unset: { currentIndex: "" } });
  console.log('Removed currentIndex from all rooms');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

