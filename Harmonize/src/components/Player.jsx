import React, { useRef, useState } from 'react';
import YouTubePlayer from './YouTubePlayer.jsx';

export default function Player({ currentSong, isAdmin, onNext, onPrev }) {
  const ytRef = useRef(null);
  const [playing, setPlaying] = useState(true);

  if (!currentSong) return null;

  const togglePlay = () => {
    if (!ytRef.current) return;
    if (playing) {
      ytRef.current.pause();
    } else {
      ytRef.current.play();
    }
    setPlaying(!playing);
  };

  const next = () => {
    if (onNext) onNext();
    setPlaying(true);
  };

  const prev = () => {
    if (onPrev) onPrev();
    setPlaying(true);
  };

  let playerElement = <div>Unsupported platform</div>;
  if (currentSong.platform === 'youtube') {
    playerElement = (
      <YouTubePlayer ref={ytRef} videoId={currentSong.sourceId} muted={!isAdmin} />
    );
  }

  return (
    <div className="player-wrapper">
      {playerElement}
      <div className="player-controls">
        <button className="skip-button" onClick={prev}>&#9198;</button>
        <button className="pause-button" onClick={togglePlay}>
          {playing ? (
            <div className="pause-icon">
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          ) : (
            <div className="play-icon">&#9658;</div>
          )}
        </button>
        <button className="skip-button" onClick={next}>&#9197;</button>
      </div>
    </div>
  );
}
