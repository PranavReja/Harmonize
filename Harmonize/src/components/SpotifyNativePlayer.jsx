import React from 'react';

function SpotifyNativePlayer({ trackUri }) {
  if (!trackUri) {
    return null;
  }

  const embedUrl = `https://open.spotify.com/embed/track/${trackUri.split(':')[2]}`;

  return (
    <iframe
      src={embedUrl}
      width="100%"
      height="352"
      frameBorder="0"
      allowTransparency="true"
      allow="encrypted-media"
      title="Spotify Player"
    ></iframe>
  );
}

export default SpotifyNativePlayer;
