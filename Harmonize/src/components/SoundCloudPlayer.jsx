import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';

const SoundCloudPlayer = forwardRef(({ trackId, playing, onEnded, onReady }, ref) => {
  const iframeRef = useRef(null);
  const widgetRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Keep refs to callbacks to handle stale closures
  const onEndedRef = useRef(onEnded);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onEndedRef.current = onEnded;
    onReadyRef.current = onReady;
  }, [onEnded, onReady]);

  useEffect(() => {
    // Load SC Widget API if not already present
    if (!window.SC) {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.onload = initializeWidget;
      document.body.appendChild(script);
    } else {
      initializeWidget();
    }

    function initializeWidget() {
      if (!iframeRef.current || !window.SC) return;
      // Initialize widget on the iframe
      const widget = window.SC.Widget(iframeRef.current);
      widgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.READY, () => {
        setIsReady(true);
        if (onReadyRef.current) onReadyRef.current();
      });

      widget.bind(window.SC.Widget.Events.FINISH, () => {
        if (onEndedRef.current) onEndedRef.current();
      });
    }
  }, []); 

  // Handle Track Change
  useEffect(() => {
    if (isReady && widgetRef.current && trackId) {
      // Load new track
      widgetRef.current.load(`https://api.soundcloud.com/tracks/${trackId}`, {
        auto_play: playing, // Auto play if global playing state is true
        show_artwork: true,
        visual: true,
        hide_related: true,
        show_comments: false,
        show_user: true,
        show_reposts: false,
        show_teaser: false
      });
    }
  }, [trackId, isReady]); // Note: Intentionally not including 'playing' here to avoid re-load on pause/play

  // Handle Play/Pause Toggle
  useEffect(() => {
    if (isReady && widgetRef.current) {
      if (playing) {
        widgetRef.current.play();
      } else {
        widgetRef.current.pause();
      }
    }
  }, [playing, isReady]);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => {
      if (widgetRef.current) {
        widgetRef.current.seekTo(seconds * 1000); // SC uses milliseconds
      }
    },
    // Returns a Promise because SC widget getters are async
    getCurrentTime: () => {
      return new Promise((resolve) => {
        if (!widgetRef.current) return resolve(0);
        widgetRef.current.getPosition((ms) => resolve(ms / 1000));
      });
    },
    getDuration: () => {
      return new Promise((resolve) => {
        if (!widgetRef.current) return resolve(0);
        widgetRef.current.getDuration((ms) => resolve(ms / 1000));
      });
    }
  }));

  return (
    <iframe
      ref={iframeRef}
      width="100%"
      height="100%"
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${trackId}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
      title="SoundCloud Player"
    ></iframe>
  );
});

export default SoundCloudPlayer;
