import React, { useEffect, useState } from 'react';
import YouTube from 'react-youtube';

export default function VariablePlayer({ song, onEnded }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (song && song.platform === 'spotify') {
      setPreviewUrl(null);
      fetch(`http://localhost:3001/spotify/track/${song.sourceId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setPreviewUrl(data.preview_url || null);
          }
        })
        .catch(() => {});
    } else {
      setPreviewUrl(null);
    }
  }, [song]);

  if (!song) return <div className="now-playing-container">Waiting for song...</div>;

  if (song.platform === 'youtube') {
    return (
      <div className="now-playing-container">
        <YouTube
          videoId={song.sourceId}
          opts={{ playerVars: { autoplay: 1 } }}
          onEnd={onEnded}
        />
      </div>
    );
  }

  if (song.platform === 'spotify') {
    return (
      <div className="now-playing-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <iframe
          src={`https://open.spotify.com/embed/track/${song.sourceId}?utm_source=generator`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
        {previewUrl && <audio src={previewUrl} autoPlay onEnded={onEnded} />}
      </div>
    );
  }

  return <div className="now-playing-container">Unsupported platform</div>;
}
