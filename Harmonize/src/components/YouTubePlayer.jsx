import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

const YouTubePlayer = forwardRef(function YouTubePlayer({ videoId, muted }, ref) {
  const iframeRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play: () => sendCommand('playVideo'),
    pause: () => sendCommand('pauseVideo'),
  }));

  const sendCommand = (cmd) => {
    if (!iframeRef.current) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: cmd, args: [] }),
      '*'
    );
  };

  if (!videoId) return null;
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&enablejsapi=1`;

  useEffect(() => {
    // autoplay after src changes
    sendCommand('playVideo');
  }, [videoId]);

  return (
    <div className="youtube-player-wrapper">
      <iframe
        className="youtube-player"
        ref={iframeRef}
        src={src}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        frameBorder="0"
      />
    </div>
  );
});

export default YouTubePlayer;
