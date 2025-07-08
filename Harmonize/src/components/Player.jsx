import React from 'react';
import YouTubePlayer from './YouTubePlayer.jsx';

export default function Player({ currentSong, isAdmin }) {
  if (!currentSong) return null;
  if (currentSong.platform === 'youtube') {
    return <YouTubePlayer videoId={currentSong.sourceId} muted={!isAdmin} />;
  }
  // Placeholder for other platforms
  return <div>Unsupported platform</div>;
}
