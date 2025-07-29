import React from 'react';
import YouTube from 'react-youtube';

export default function YouTubePlayer({ videoId, onEnded }) {
  if (!videoId) return null;
  const opts = { playerVars: { autoplay: 1 } };
  return (
    <YouTube
      videoId={videoId}
      opts={opts}
      onEnd={onEnded}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
