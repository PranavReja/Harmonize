import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function SpotifyNativePlayer({ accessToken, onPlayerStateChanged, userId, onTokenRefreshed }, ref) {
  const playerRef = useRef(null);
  const tokenRef = useRef(accessToken);
  const deviceIdRef = useRef(null);

  const onPlayerStateChangedRef = useRef(onPlayerStateChanged);
  const onTokenRefreshedRef = useRef(onTokenRefreshed);

  useEffect(() => {
    onPlayerStateChangedRef.current = onPlayerStateChanged;
  }, [onPlayerStateChanged]);

  useEffect(() => {
    onTokenRefreshedRef.current = onTokenRefreshed;
  }, [onTokenRefreshed]);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const refreshToken = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/spotify/refresh_token?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      const data = await response.json();
      tokenRef.current = data.accessToken;
      if (onTokenRefreshedRef.current) {
        onTokenRefreshedRef.current(data.accessToken, data.expiresIn);
      }
      return data.accessToken;
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
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
          cb(tokenRef.current);
        },
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        deviceIdRef.current = device_id;
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.addListener('player_state_changed', (state) => {
        if (onPlayerStateChangedRef.current) {
          onPlayerStateChangedRef.current(state);
        }
      });

      player.addListener('authentication_error', async ({ message }) => {
        console.error('Authentication error:', message);
        await refreshToken();
      });

      player.connect();
      playerRef.current = player;
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
      // Clean up the script to avoid memory leaks
      const scriptElement = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
      if (scriptElement) {
        document.body.removeChild(scriptElement);
      }
      window.onSpotifyWebPlaybackSDKReady = null;
    };
  }, [userId]);

  const play = async (trackUri, position_ms = 0) => {
    const player = playerRef.current;
    if (!player || !deviceIdRef.current) return;

    const playRequest = async (token) => {
      const body = {
        uris: [trackUri],
        position_ms: position_ms,
      };
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    };

    let response = await playRequest(tokenRef.current);
    if (response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        response = await playRequest(newToken);
      }
    }
    if (!response.ok) {
      console.error('Failed to play track');
    }
  };

  useImperativeHandle(ref, () => ({
    play,
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

export default forwardRef(SpotifyNativePlayer);