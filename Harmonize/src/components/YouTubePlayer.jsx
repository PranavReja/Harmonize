import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';

function YouTubePlayer({ videoId, playing, onVideoEnd, onReady }, ref) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  // Separate DOM node for the YouTube API so destroying the player doesn't
  // remove the React-managed container element. This avoids a DOM mismatch
  // error when React later tries to unmount the component.
  const playerContainerRef = useRef(null);

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
      // Ensure the dynamically created player container is removed so the
      // outer React element remains in place for React to unmount safely.
      if (playerContainerRef.current) {
        playerContainerRef.current.remove();
        playerContainerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPlayerReady = () => {
    setIsPlayerReady(true);
    if (onReady) {
      onReady();
    }
  };

  const createPlayer = () => {
    if (playerRef.current || !containerRef.current) return;
    // Lazily create a child node for the YouTube player if it doesn't exist
    if (!playerContainerRef.current) {
      playerContainerRef.current = document.createElement('div');
      containerRef.current.appendChild(playerContainerRef.current);
    }

    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      videoId,
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      onVideoEnd();
    }
  };

  // Load a new video whenever videoId changes
  useEffect(() => {
    if (isPlayerReady && playerRef.current && videoId) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId, isPlayerReady]);

  // Play or pause when the playing prop changes
  useEffect(() => {
    if (isPlayerReady && playerRef.current) {
      if (playing) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [playing, isPlayerReady, videoId]);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => playerRef.current?.getCurrentTime() || 0,
    getDuration: () => playerRef.current?.getDuration() || 0,
    seekTo: (s) => playerRef.current?.seekTo(s, true),
  }));

  return <div className="youtube-player" ref={containerRef} />;
}

export default forwardRef(YouTubePlayer);