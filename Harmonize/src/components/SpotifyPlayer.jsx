import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

function SpotifyPlayer({ accessToken, onPlayerStateChanged }, ref) {
  const playerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Harmonize Web Player',
        getOAuthToken: (cb) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.addListener('player_state_changed', (state) => {
        if (onPlayerStateChanged) {
          onPlayerStateChanged(state);
        }
      });

      player.connect();

      playerRef.current = player;
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [accessToken, onPlayerStateChanged]);

  useImperativeHandle(ref, () => ({
    play: (trackUri) => {
      const player = playerRef.current;
      if (player) {
        player._options.getOAuthToken((token) => {
          fetch(`https://api.spotify.com/v1/me/player/play?device_id=${player._options.id}`,
            {
              method: 'PUT',
              body: JSON.stringify({ uris: [trackUri] }),
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );
        });
      }
    },
    pause: () => {
      const player = playerRef.current;
      if (player) {
        player.pause();
      }
    },
    seek: (positionMs) => {
      const player = playerRef.current;
      if (player) {
        player.seek(positionMs);
      }
    },
    getCurrentState: () => {
        const player = playerRef.current;
        if (player) {
            return player.getCurrentState();
        }
        return null;
    }
  }));

  return null;
}

export default forwardRef(SpotifyPlayer);
