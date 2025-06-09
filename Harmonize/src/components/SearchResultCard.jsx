import React from 'react';

export default function SearchResultCard({
  title,
  artist,
  service,
  thumbnail,
  url,
  onAdd,
  onPlayNext,
}) {
  return (
    <div className="result-card">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="result-link"
      >
        {thumbnail ? (
          <img src={thumbnail} alt="thumbnail" className="album-cover" />
        ) : (
          <div className="album-cover-placeholder" />
        )}
        <div className="song-info">
          <div className="song-title">{title}</div>
          <div className="artist-name">{artist}</div>
        </div>
        <div className="service-info">{service}</div>
      </a>
      <div className="action-buttons">
        <button className="add-to-queue-button" onClick={onAdd}>+</button>
        <button className="play-next-button" onClick={onPlayNext}>↑</button>

      </div>
    </div>
  );
}
