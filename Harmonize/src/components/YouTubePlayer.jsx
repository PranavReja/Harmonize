import React, { useEffect, useRef } from 'react';

export default function YouTubePlayer({ videoId, playing, muted, onReady }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
        return;
      }
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { autoplay: 0, controls: 1 },
        events: {
          onReady: () => {
            if (muted) playerRef.current.mute();
            if (playing) playerRef.current.playVideo();
            onReady?.(playerRef.current);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (!playerRef.current) return;
    if (playing) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [playing]);

  useEffect(() => {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unMute();
    }
  }, [muted]);

  return <div ref={containerRef} className="youtube-player" />;
}
