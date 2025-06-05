import React, { useState, useEffect } from 'react';

export default function SearchResultCard({
  title,
  artist,
  service,
  onAdd,
  onPlayNext,
}) {
  const [addClicked, setAddClicked] = useState(false);
  const [nextClicked, setNextClicked] = useState(false);

  useEffect(() => {
    if (addClicked) {
      const timer = setTimeout(() => setAddClicked(false), 200);
      return () => clearTimeout(timer);
    }
  }, [addClicked]);

  useEffect(() => {
    if (nextClicked) {
      const timer = setTimeout(() => setNextClicked(false), 200);
      return () => clearTimeout(timer);
    }
  }, [nextClicked]);

  const handleAdd = () => {
    setAddClicked(true);
    onAdd();
  };

  const handlePlayNext = () => {
    setNextClicked(true);
    onPlayNext();
  };
  return (
    <div className="result-card">
      <div className="album-cover-placeholder" />
      <div className="song-info">
        <div className="song-title">{title}</div>
        <div className="artist-name">{artist}</div>
      </div>
      <div className="service-info">{service}</div>
      <div className="action-buttons">
        <button
          className={`add-to-queue-button${addClicked ? ' clicked' : ''}`}
          onClick={handleAdd}
        >
          +
        </button>
        <button
          className={`play-next-button${nextClicked ? ' clicked' : ''}`}
          onClick={handlePlayNext}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
