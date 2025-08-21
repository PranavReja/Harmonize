import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  currentRoom: { type: String, default: null },
  services: {
    spotify: {
      accessToken: String,
      refreshToken: String,
      expiresAt: Date,
      connected: { type: Boolean, default: false }
    },
    youtube: {
      connected: { type: Boolean, default: false }
    },
    soundcloud: {
      connected: { type: Boolean, default: false }
    }
  }
});

export default mongoose.model('User', UserSchema);
