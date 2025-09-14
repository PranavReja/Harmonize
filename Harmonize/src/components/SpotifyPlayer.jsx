import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

function SpotifyPlayer({ accessToken, onPlayerStateChanged, userId, onTokenRefreshed }, ref) {
  const playerRef = useRef(null);
  const tokenRef = useRef(accessToken);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const refreshToken = async () => {
    try {
      const response = await fetch(`/api/auth/spotify/refresh_token?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      const data = await response.json();
      tokenRef.current = data.accessToken;
      if (onTokenRefreshed) {
        onTokenRefreshed(data.accessToken, data.expiresIn);
      }
      return data.accessToken;
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      // Handle token refresh failure, e.g., by redirecting to login
      return null;
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Harmonize Web Player',
        getOAuthToken: (cb) => {
          // For simplicity, we assume the token is always fresh on initialization.
          // A more robust solution would check expiration here as well.
          cb(tokenRef.current);
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
        console.log(state);
        if (onPlayerStateChanged) {
          onPlayerStateChanged(state);
        }
      });

      // Handle authentication errors
      player.addListener('authentication_error', async ({ message }) => {
        console.error('Authentication error:', message);
        const newToken = await refreshToken();
        if (newToken) {
          // After refreshing the token, you might need to reconnect or re-initialize the player
          // For now, we assume the next action will use the new token.
          console.log('Token refreshed. Player should be operational again.');
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
  }, [userId, onPlayerStateChanged, onTokenRefreshed]);

  useImperativeHandle(ref, () => ({
    play: (trackUri) => {
      const player = playerRef.current;
      if (player) {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${player._options.id}`, {
          method: 'PUT',
          body: JSON.stringify({ uris: [trackUri] }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }).then(async (res) => {
          if (res.status === 401) {
            const newToken = await refreshToken();
            if (newToken) {
              // Retry the play command with the new token
              fetch(`https://api.spotify.com/v1/me/player/play?device_id=${player._options.id}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: [trackUri] }),
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${newToken}`,
                },
              });
            }
          }
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
