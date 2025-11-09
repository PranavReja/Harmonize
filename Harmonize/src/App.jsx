import TopBar from './components/TopBar';
import './styles.css';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import YouTubeLogo from './assets/youtube.png';
import SpotifyLogo from './assets/spotify.svg';
import SoundCloudLogo from './assets/soundcloud.svg';
import RightSidebar from './components/RightSidebar';
import UserCard from './components/UserCard';
import RoomSetupModal from './components/RoomSetupModal.jsx';
import YouTubePlayer from './components/YouTubePlayer.jsx';
import SpotifyNativePlayer from './components/SpotifyNativePlayer.jsx';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [isLeftSidebarVisible, setIsLeftSidebarVisible] = useState(true);
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
  const [leftWidth, setLeftWidth] = useState(240);
  const minLeftWidth = 180;
  const maxLeftWidth = 400;
  const [showRoomModal, setShowRoomModal] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [spotifyAccessToken, setSpotifyAccessToken] = useState(null);
  const { roomId: pathRoomId } = useParams();

  const isResizingLeft = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft.current) {
        const newWidth = e.clientX;
        if (newWidth >= minLeftWidth && newWidth <= maxLeftWidth) {
          setLeftWidth(newWidth);
        }
      }
    };

    const stopResizing = () => {
      isResizingLeft.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, []);

  const clearSession = () => {
    setRoomId(null);
    setRoomName('');
    setCurrentUserId(null);
    setUsers([]);
    setShowRoomModal(true);
    localStorage.removeItem('roomId');
    localStorage.removeItem('roomName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
  };

  const handleCopyInviteLink = async () => {
    if (!roomId) return;
    const url = `${window.location.origin}/${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    } catch (err) {
      console.error('Copy link error', err);
    }
  };

  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (pathRoomId) return;
    const savedRoomId = localStorage.getItem('roomId');
    const savedUserId = localStorage.getItem('userId');
    if (savedRoomId && savedUserId) {
      const verify = async () => {
        const ok = await fetchRoomUsers(savedRoomId, true);
        if (ok) {
          setRoomId(savedRoomId);
          setRoomName(localStorage.getItem('roomName') || '');
          setCurrentUserId(savedUserId);
          setShowRoomModal(false);
        }
      };
      verify();
    }
  }, [pathRoomId]);

  useEffect(() => {
    const fetchToken = async () => {
      if (currentUserId) {
        try {
          const res = await fetch(`${API_URL}/users/${currentUserId}`);
          const data = await res.json();
          if (res.ok && data.services?.spotify?.accessToken) {
            setSpotifyAccessToken(data.services.spotify.accessToken);
          }
        } catch (err) {
          console.error('Fetch user data error', err);
        }
      }
    };
    fetchToken();
  }, [currentUserId]);


  const [spotifyAuthMessage, setSpotifyAuthMessage] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('userId');
    if (userIdFromUrl) {
      localStorage.setItem('userId', userIdFromUrl);
      setSpotifyAuthMessage(`Spotify connected for user: ${userIdFromUrl}`);
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setSpotifyAuthMessage(null), 5000); // Message disappears after 5 seconds
    }
  }, []);

  const SONG_TITLE = 'Song Name 🎵';
  const [totalDuration, setTotalDuration] = useState(0);
  const [isYtPlayerReady, setIsYtPlayerReady] = useState(false);

  const [progress, setProgress] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeButton, setActiveButton] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(-1);

  const progressBarRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const spotifyNativePlayerRef = useRef(null);

  const initialQueue = [];

  const [queue, setQueue] = useState(initialQueue);
  const [albumCovers, setAlbumCovers] = useState({});

  const logoMap = {
    youtube: YouTubeLogo,
    spotify: SpotifyLogo,
    soundcloud: SoundCloudLogo,
  };

  const getAlbumCover = async (platform, sourceId) => {
    const key = `${platform}:${sourceId}`;
    if (albumCovers[key]) return albumCovers[key];
    let url = '';
    try {
      if (platform === 'youtube') {
        url = `https://img.youtube.com/vi/${sourceId}/default.jpg`;
      } else if (platform === 'spotify') {
        const res = await fetch(`${API_URL}/spotify/track/${sourceId}`);
        const data = await res.json();
        if (res.ok) url = data.thumbnail || '';
      }
    } catch (err) {
      console.error('Album cover fetch error', err);
    }
    if (url) {
      setAlbumCovers((prev) => ({ ...prev, [key]: url }));
    }
    return url;
  };

  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [roomEnded, setRoomEnded] = useState(false);

  const sendSong = async (song, playNext = false) => {
    if (!roomId || !currentUserId) return;
    const endpoint = playNext
      ? `${API_URL}/rooms/${roomId}/queue/next`
      : `${API_URL}/rooms/${roomId}/queue`;
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: song.title,
          artist: song.artist,
          platform: song.platform,
          sourceId: song.sourceId,
          addedBy: currentUserId,
        }),
      });
    } catch (err) {
      console.error('Queue song error', err);
    }
  };

  const fetchRoomQueue = async (id) => {
    try {
      const res = await fetch(`${API_URL}/rooms/${id}/queue`);
      const data = await res.json();
      if (res.ok) {
        const keepKeys = new Set();
        const mapped = await Promise.all(
          data.queue.map(async (q) => {
            const key = `${q.platform}:${q.sourceId}`;
            keepKeys.add(key);
            const albumCover = await getAlbumCover(q.platform, q.sourceId);
            return {
              id: `pos-${q.position}`,
              albumCover,
              title: q.title,
              artist: q.artist,
              serviceLogo: logoMap[q.platform] || '',
              queuedBy:
                q.addedByName ||
                (users.find((u) => u.userId === q.addedBy)?.username || 'Unknown'),
              platform: q.platform,
              sourceId: q.sourceId,
              position: q.position,
              timeOfSong: q.timeOfSong,
              durationSec: q.durationSec,
              mostRecentChange: q.mostRecentChange,
            };
          })
        );
        // Clean up album cache
        setAlbumCovers((prev) => {
          const updated = {};
          for (const k of Object.keys(prev)) {
            if (keepKeys.has(k)) updated[k] = prev[k];
          }
          return updated;
        });
        setQueue(mapped);
        return true;
      }
    } catch (err) {
      console.error('Fetch queue error', err);
    }
    return false;
  };

  const fetchCurrentPlaying = async (id) => {
    try {
      const res = await fetch(`${API_URL}/rooms/${id}/current-playing`);
      const data = await res.json();
      if (res.ok) {
        setCurrentPlaying(data.currentPlaying);
        return true;
      }
    } catch (err) {
      console.error('Fetch current playing error', err);
    }
    return false;
  };

  const updateCurrentPlaying = async (index) => {
    if (!roomId) return;
    try {
      await fetch(`${API_URL}/rooms/${roomId}/current-playing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      setCurrentPlaying(index);
    } catch (err) {
      console.error('Update current playing error', err);
    }
  };

  const storeAlbumCover = (item) => {
    if (!item.sourceId) return;
    const key = `${item.platform}:${item.sourceId}`;
    if (item.albumCover) {
      setAlbumCovers((prev) => ({ ...prev, [key]: item.albumCover }));
    }
  };

  const addToQueueTop = async (item) => {
    storeAlbumCover(item);
    await sendSong(item, true);
    fetchRoomQueue(roomId);
  };
  const addToQueueBottom = async (item) => {
    storeAlbumCover(item);
    await sendSong(item, false);
    fetchRoomQueue(roomId);
  };

  const handleSeekStart = (e) => {
    setIsSeeking(true);
    updateSeek(e);
  };

  const handleSeekMove = (e) => {
    if (isSeeking) updateSeek(e);
  };

  const handleSeekEnd = async () => {
    setIsSeeking(false);
    if (!isAdmin || !nowPlaying) return;

    const newTime = (progress / 100) * totalDuration;

    if (nowPlaying.platform === 'youtube' && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(newTime);
    } else if (nowPlaying.platform === 'spotify' && spotifyNativePlayerRef.current) {
      spotifyNativePlayerRef.current.seek(newTime * 1000);
    }

    if (roomId && currentPlaying >= 0) {
      try {
        const newState = isPlaying ? 'Played' : 'Paused';
        await fetch(`${API_URL}/rooms/${roomId}/queue/${currentPlaying}/most-recent-change`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: newState, positionSec: newTime }),
        });
      } catch (err) {
        console.error('Most recent change update error', err);
      }
    }
  };

  const updateSeek = (e) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    setProgress(percentage);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleTogglePlay = async () => {
    if (isAdmin) {
      if (!isPlaying && currentPlaying === -1 && queue.length > 0) {
        await updateCurrentPlaying(0);
        setIsPlaying(true);
        setActiveButton('play');
        setTimeout(() => setActiveButton(null), 200);
        return;
      }

      if (nowPlaying.platform === 'spotify' && spotifyNativePlayerRef.current) {
        if (isPlaying) {
          spotifyNativePlayerRef.current.pause();
        } else {
          const positionMs = (progress / 100) * totalDuration * 1000;
          spotifyNativePlayerRef.current.play(`spotify:track:${nowPlaying.sourceId}`, positionMs);
        }
        setIsPlaying(!isPlaying);
      } else {
        const newState = isPlaying ? 'Paused' : 'Played';
        const positionSec = Math.round((progress / 100) * totalDuration);
  
        if (roomId && currentPlaying >= 0) {
          try {
            await fetch(`${API_URL}/rooms/${roomId}/queue/${currentPlaying}/most-recent-change`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ state: newState, positionSec })
            });
          } catch (err) {
            console.error('Most recent change update error', err);
          }
        }
  
        setIsPlaying(!isPlaying);
      }
      setActiveButton('play');
      setTimeout(() => setActiveButton(null), 200);
    } else {
      // Non-admin logic
      const positionSec = Math.round((progress / 100) * totalDuration);
      try {
        await fetch(`${API_URL}/rooms/${roomId}/queue/${currentPlaying}/most-recent-change`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: 'ToggleRequest', positionSec })
        });
      } catch (err) {
        console.error('Playback request error', err);
      }
    }
  };

  const handleSkip = (direction) => {
    if (nowPlaying && nowPlaying.platform === 'spotify' && spotifyNativePlayerRef.current) {
      spotifyNativePlayerRef.current.pause();
    }

    let newIndex = currentPlaying;
    if (direction === 'next') {
      newIndex = Math.min(currentPlaying + 1, queue.length - 1);
    } else if (direction === 'prev') {
      if (currentPlaying <= 0) return;
      newIndex = currentPlaying - 1;
    }

    if (isAdmin) {
      const newTrack = queue[newIndex];
      if (newTrack && newTrack.platform === 'spotify' && spotifyNativePlayerRef.current) {
        spotifyNativePlayerRef.current.play(`spotify:track:${newTrack.sourceId}`);
      }
    }

    updateCurrentPlaying(newIndex);
    setActiveButton(direction);
    setTimeout(() => setActiveButton(null), 200);

    // When the admin skips, optimistically set the UI to "playing"
    // because the new track will autoplay.
    if (isAdmin) {
      setIsPlaying(true);
    }
  };

  const handleTokenRefreshed = (newAccessToken, newExpiresIn) => {
    setSpotifyAccessToken(newAccessToken);
    // You might want to schedule the next refresh based on newExpiresIn
  };


  const handleVideoEnd = () => {
    if (isAdmin) {
      handleSkip('next');
    }
  };

  const handleConfirmLeave = async () => {
    if (!roomId || !currentUserId) return;
    if (isAdmin) {
      try {
        await fetch(`${API_URL}/rooms/${roomId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Delete room error', err);
      }
      setRoomEnded(true);
    } else {
      try {
        await fetch(`${API_URL}/rooms/${roomId}/remove-user`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId }),
        });
      } catch (err) {
        console.error('Leave room error', err);
      }
    }
    clearSession();
    setShowConfirmLeave(false);
  };

  const fetchRoomUsers = async (id, handleMissing = false) => {
    try {
      const res = await fetch(`${API_URL}/rooms/${id}/users`);
      if (res.status === 404) {
        if (handleMissing) {
          clearSession();
          setRoomEnded(true);
        }
        return false;
      }
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        return true;
      }
    } catch (err) {
      console.error('Fetch users error', err);
    }
    return false;
  };

  const handleRoomJoined = (id, name, uid, uname) => {
    setRoomId(id);
    setRoomName(name || '');
    setCurrentUserId(uid);
    setShowRoomModal(false);
    localStorage.setItem('roomId', id);
    localStorage.setItem('roomName', name || '');
    localStorage.setItem('userId', uid);
    if (uname) localStorage.setItem('userName', uname);
    fetchRoomUsers(id);
    fetchRoomQueue(id);
    fetchCurrentPlaying(id);
  };

  useEffect(() => {
    if (roomId) {
      fetchRoomUsers(roomId);
      fetchRoomQueue(roomId);
      fetchCurrentPlaying(roomId);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const id = setInterval(() => {
      fetchRoomUsers(roomId, true).then((ok) => {
        if (!ok) setRoomEnded(true);
      });
      fetchRoomQueue(roomId);
      fetchCurrentPlaying(roomId);
    }, 5000);
    return () => clearInterval(id);
  }, [roomId]);
  const currentUser = users.find((u) => u.userId === currentUserId);
  const isAdmin = currentUser?.isAdmin;
  const nowPlaying =
    currentPlaying >= 0 && currentPlaying < queue.length
      ? queue[currentPlaying]
      : null;

  useEffect(() => {
    if (isAdmin && nowPlaying?.mostRecentChange?.state === 'ToggleRequest') {
      handleTogglePlay();
    }
  }, [nowPlaying, isAdmin]);

  const prevSourceId = useRef();

  useEffect(() => {
    if (isAdmin && nowPlaying && nowPlaying.platform === 'spotify' && spotifyNativePlayerRef.current) {
      if (nowPlaying.sourceId !== prevSourceId.current) {
        const positionMs = nowPlaying.mostRecentChange?.positionSec ? nowPlaying.mostRecentChange.positionSec * 1000 : 0;
        spotifyNativePlayerRef.current.play(`spotify:track:${nowPlaying.sourceId}`, positionMs);
        setIsPlaying(true);
        prevSourceId.current = nowPlaying.sourceId;
      }
    }
  }, [nowPlaying, isAdmin]);

  useEffect(() => {
    if (nowPlaying) {
      if (nowPlaying.platform === 'spotify') {
        // Duration for Spotify is set in the onPlayerStateChanged callback
      } else {
        setTotalDuration(nowPlaying.durationSec || 0);
      }
    } else {
      setTotalDuration(0);
    }
  }, [currentPlaying, nowPlaying]);



  useEffect(() => {
    if (!isAdmin) return;

    const platform = nowPlaying?.platform;
    if (platform !== 'youtube' && platform !== 'spotify') return;

    const id = setInterval(() => {
      if (isSeeking) return;

      if (platform === 'youtube' && ytPlayerRef.current) {
        const duration = ytPlayerRef.current.getDuration();
        const current = ytPlayerRef.current.getCurrentTime();
        if (duration > 0) {
          setTotalDuration(duration);
          setProgress((current / duration) * 100);
        }
      }
      // Note: Spotify progress is handled by the onPlayerStateChanged callback
    }, 1000);

    return () => clearInterval(id);
  }, [isAdmin, nowPlaying, isSeeking]);

  useEffect(() => {
    if (isAdmin || !nowPlaying) {
      return;
    }

    const { timeOfSong, mostRecentChange, durationSec: duration, platform } = nowPlaying;

    if (!timeOfSong) {
      return;
    }

    let intervalId;

    const updateProgress = () => {
      const officialState = mostRecentChange?.state;

      if (officialState === 'Paused' || officialState === 'ToggleRequest') {
        if (intervalId) clearInterval(intervalId);
        setIsPlaying(false);
        if (duration > 0) {
          setProgress((mostRecentChange.positionSec / duration) * 100);
        }
      } else if (officialState === 'Played') {
        setIsPlaying(true);
        const startTime = mostRecentChange.timestamp;
        const startPosition = mostRecentChange.positionSec;
        const timeNow = Math.floor(Date.now() / 1000);
        const elapsed = timeNow - startTime;
        const currentPosition = startPosition + elapsed;

        if (duration > 0) {
          const progressPercentage = (currentPosition / duration) * 100;
          if (progressPercentage >= 0 && progressPercentage <= 100) {
            setProgress(progressPercentage);
          }
        }
      }
    };

    updateProgress();

    if (mostRecentChange?.state === 'Played') {
      intervalId = setInterval(updateProgress, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [nowPlaying, isAdmin]);

  const onPlayerStateChanged = useCallback((state) => {
    if (state) {
      const {
        duration,
        position,
        paused,
        track_window: { current_track },
      } = state;
      setIsPlaying(!paused);
      setTotalDuration(duration / 1000);
      setProgress((position / duration) * 100);

      if (nowPlaying && nowPlaying.sourceId !== current_track.id) {
        // The player has changed to a different track, probably from another device
        // We can try to find this track in the queue and update the currentPlaying index
      }
    }
  }, [nowPlaying]);

  return (
    <>
      {isAdmin && spotifyAccessToken && (
        <SpotifyNativePlayer
          ref={spotifyNativePlayerRef}
          accessToken={spotifyAccessToken}
          onPlayerStateChanged={onPlayerStateChanged}
          userId={currentUserId}
          onTokenRefreshed={handleTokenRefreshed}
        />
      )}
      {spotifyAuthMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 1000,
          fontSize: '1.2em'
        }}>
          {spotifyAuthMessage}
        </div>
      )}
      {showRoomModal && (
        <RoomSetupModal
          onClose={() => setShowRoomModal(false)}
          onRoomJoined={handleRoomJoined}
          joinRoomId={pathRoomId}
        />
      )}
      <TopBar
        addToQueueTop={addToQueueTop}
        addToQueueBottom={addToQueueBottom}
        users={users}
        currentUserId={currentUserId}
        refreshUsers={() => roomId && fetchRoomUsers(roomId)}
      />
      <div className="app-layout">
        {/* Left Sidebar */}
<div
  className={`left-sidebar-wrapper ${isLeftSidebarVisible ? 'slide-in' : 'slide-out'}`}
  style={{ width: isLeftSidebarVisible ? leftWidth : 0 }}
>
  <div
    className="sidebar left-sidebar"
    style={{ width: leftWidth }}
  >

            {/* 👇 Right edge resizer for left sidebar */}
            <div
              className="sidebar-right-edge"
              onMouseDown={() => (isResizingLeft.current = true)}
            />
            <div className="sidebar-section">
              <h2 className="sidebar-title">Room: {roomName || 'Not Connected'}</h2>
              {roomId && (
                <h3 className="sidebar-subtitle">Room Code: {roomId}</h3>
              )}
              <button
                className={`copy-button${copySuccess ? ' active' : ''}`}
                onClick={handleCopyInviteLink}
                disabled={!roomId}
              >
                {copySuccess ? 'Copied!' : 'Room Invite Link'}
              </button>
            </div>
            <div className="sidebar-section">
              <h3 className="sidebar-subtitle">Listeners</h3>
              <ul className="user-list">
                {users.map((u) => (
                  <UserCard key={u.userId} user={u} isCurrent={u.userId === currentUserId} />
                ))}
              </ul>
            </div>
            <div className="sidebar-section leave-section">
              <button
                className="leave-room-button"
                onClick={() => setShowConfirmLeave(true)}
                disabled={!roomId}
              >
                {isAdmin ? 'End Listening Room' : 'Leave Room'}
              </button>
            </div>
          </div>
          </div>

        {/* Main Area */}
        <div className="main-area">
          <div
            className="sidebar-handle left-handle"
            onClick={() => setIsLeftSidebarVisible(prev => !prev)}
          >
            {isLeftSidebarVisible ? '⮜' : '⮞'}
          </div>

          <main className="main-content">
            <div className="now-playing-container">
              <div className="now-playing-cover">
                {isAdmin && nowPlaying && nowPlaying.platform === 'youtube' ? (
                  <YouTubePlayer
                    ref={ytPlayerRef}
                    videoId={nowPlaying.sourceId}
                    playing={isPlaying}
                    onVideoEnd={handleVideoEnd}
                    onReady={() => setIsYtPlayerReady(true)}
                  />
                ) : nowPlaying ? (
                  <img src={nowPlaying.albumCover} alt="cover" />
                ) : (
                  <div className="cover-placeholder">Album Cover</div>
                )}
              </div>

              <div className="now-playing-text">
                <div className="now-playing-title">
                  {nowPlaying ? nowPlaying.title : 'No Song Playing'}
                </div>
                <div className="now-playing-artist">
                  {nowPlaying ? nowPlaying.artist : ''}
                </div>
              </div>

              <div className="now-playing-progress">
                <div
                  className="progress-bar"
                  onMouseDown={handleSeekStart}
                  onMouseMove={handleSeekMove}
                  onMouseUp={handleSeekEnd}
                  onMouseLeave={handleSeekEnd}
                  ref={progressBarRef}
                >
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  <div className="progress-thumb" style={{ left: `${progress}%` }}></div>
                </div>

                <div className="progress-time">
                  <span className="current-time">
                    {formatTime((progress / 100) * totalDuration)}
                  </span>
                  <span className="total-time">{formatTime(totalDuration)}</span>
                </div>
              </div>

              <div className="player-controls">
                <button
                  className={`skip-button ${activeButton === 'prev' ? 'active' : ''}`}
                  onClick={() => handleSkip('prev')}
                  disabled={currentPlaying <= 0}
                >
                  &#9198;
                </button>
                <button className={`pause-button ${activeButton === 'play' ? 'active' : ''}`} onClick={handleTogglePlay}>
                  {isPlaying ? (
                    <div className="pause-icon">
                      <div className="bar"></div>
                      <div className="bar"></div>
                    </div>
                  ) : (
                    <div className="play-icon">&#9658;</div>
                  )}
                </button>
                <button className={`skip-button ${activeButton === 'next' ? 'active' : ''}`} onClick={() => handleSkip('next')}>
                  &#9197;
                </button>
              </div>
            </div>

            <div className="sidebar-handle right-handle" onClick={() => setIsRightSidebarVisible(prev => !prev)}>
              {isRightSidebarVisible ? '⮞' : '⮜'}
            </div>
          </main>

        </div>
        <div
          className={`right-sidebar-container ${
            isRightSidebarVisible ? 'slide-in' : 'slide-out'
          }`}
        >
        <RightSidebar
          isVisible={isRightSidebarVisible}
          queue={queue}
          setQueue={setQueue}
          roomId={roomId}
          fetchRoomQueue={fetchRoomQueue}
          currentPlaying={currentPlaying}
        />
      </div>

      {showConfirmLeave && (
        <div className="modal-overlay" onClick={() => setShowConfirmLeave(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title" style={{ marginBottom: '1rem' }}>Are you sure?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button className="submit-link-button" onClick={handleConfirmLeave}>Yes</button>
              <button className="submit-link-button" onClick={() => setShowConfirmLeave(false)}>No</button>
            </div>
          </div>
        </div>
      )}

      {roomEnded && (
        <div className="modal-overlay" onClick={() => setRoomEnded(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title" style={{ marginBottom: '1rem' }}>
              Listening room has ended
            </p>
            <button className="submit-link-button" onClick={() => setRoomEnded(false)}>OK</button>
          </div>
        </div>
      )}

      </div>
    </>
  );
}

export default App;