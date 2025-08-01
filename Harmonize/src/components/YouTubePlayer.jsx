import React, { useEffect, useRef } from 'react';

export default function YouTubePlayer({ videoId, playing }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    // Load the YouTube Iframe API if it hasn't been loaded yet
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    } else if (window.YT && window.YT.Player && !playerRef.current) {
      createPlayer();
    }

    // The API will call this function when it's ready
    window.onYouTubeIframeAPIReady = () => {
      createPlayer();
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPlayer = () => {
    if (playerRef.current || !containerRef.current) return;
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: 1,
      },
    });
  };

  // Load a new video whenever videoId changes
  useEffect(() => {
    if (playerRef.current && videoId) {
      playerRef.current.loadVideoById(videoId);
      if (!playing) {
        playerRef.current.pauseVideo();
      }
    }
  }, [videoId]);

  // Play or pause when the playing prop changes
  useEffect(() => {
    if (playerRef.current) {
      if (playing) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [playing]);

  return <div className="youtube-player" ref={containerRef} />;
}
