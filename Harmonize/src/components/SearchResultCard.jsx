import React from 'react';

export default function SearchResultCard({ title, artist, service, onAdd }) {
  return (
    <div className="result-card">
      <div className="album-cover-placeholder" />
      <div className="song-info">
        <div className="song-title">{title}</div>
        <div className="artist-name">{artist}</div>
      </div>
      <button className="add-to-queue-button" onClick={onAdd}>+</button>
      <div className="service-info">{service}</div>
    </div>
  );
}
