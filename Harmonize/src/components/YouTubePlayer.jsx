import React from 'react';

export default function YouTubePlayer({ videoId, muted }) {
  if (!videoId) return null;
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&controls=1`;
  return (
    <div className="youtube-player-wrapper">
      <iframe
        className="youtube-player"
        src={src}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        frameBorder="0"
      />
    </div>
  );
}
