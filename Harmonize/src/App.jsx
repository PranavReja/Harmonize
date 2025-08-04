import TopBar from './components/TopBar';
import './styles.css';
import React, { useState, useRef, useEffect } from 'react';
import YouTubeLogo from './assets/youtube.png';
import SpotifyLogo from './assets/spotify.svg';
import SoundCloudLogo from './assets/soundcloud.svg';
import RightSidebar from './components/RightSidebar';
import UserCard from './components/UserCard';
import RoomSetupModal from './components/RoomSetupModal.jsx';
import YouTubePlayer from './components/YouTubePlayer.jsx';

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
  const pathRoomId = (() => {
    const p = window.location.pathname.slice(1);
    return /^[A-Za-z0-9]{6}$/.test(p) ? p : null;
  })();

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
    if (queueAbortRef.current) queueAbortRef.current.abort();
    if (currentPlayingAbortRef.current) currentPlayingAbortRef.current.abort();
    if (usersAbortRef.current) usersAbortRef.current.abort();
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
  }, []);

  const SONG_TITLE = 'Song Name 🎵';
  const [totalDuration, setTotalDuration] = useState(0);

  const [progress, setProgress] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeButton, setActiveButton] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(-1);

  const progressBarRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const seekStartRef = useRef(0);
  const queueAbortRef = useRef(null);
  const currentPlayingAbortRef = useRef(null);
  const usersAbortRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

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
        const res = await fetch(`http://localhost:3001/spotify/track/${sourceId}`);
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
      ? `http://localhost:3001/rooms/${roomId}/queue/next`
      : `http://localhost:3001/rooms/${roomId}/queue`;
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
      if (queueAbortRef.current) queueAbortRef.current.abort();
      const controller = new AbortController();
      queueAbortRef.current = controller;
      const res = await fetch(`http://localhost:3001/rooms/${id}/queue`, {
        signal: controller.signal,
      });
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
      if (err.name !== 'AbortError') {
        console.error('Fetch queue error', err);
      }
    }
    return false;
  };

  const fetchCurrentPlaying = async (id) => {
    try {
      if (currentPlayingAbortRef.current) currentPlayingAbortRef.current.abort();
      const controller = new AbortController();
      currentPlayingAbortRef.current = controller;
      const res = await fetch(`http://localhost:3001/rooms/${id}/current-playing`, {
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPlaying(data.currentPlaying);
        return true;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch current playing error', err);
      }
    }
    return false;
  };

  const updateCurrentPlaying = async (index) => {
    if (!roomId) return;
    try {
      await fetch(`http://localhost:3001/rooms/${roomId}/current-playing`, {
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
    seekStartRef.current = progress;
    setIsSeeking(true);
    updateSeek(e);
  };

  const handleSeekMove = (e) => {
    if (isSeeking) updateSeek(e);
  };

  const handleSeekEnd = async () => {
    setIsSeeking(false);
    if (
      isAdmin &&
      nowPlaying?.platform === 'youtube' &&
      ytPlayerRef.current &&
      totalDuration
    ) {
      const newTime = (progress / 100) * totalDuration;
      const prevTime = (seekStartRef.current / 100) * totalDuration;
      const state = newTime >= prevTime ? 'Forward' : 'Backward';
      if (isPlaying) {
        ytPlayerRef.current.pause();
      }
      ytPlayerRef.current.seekTo(newTime);
      if (isPlaying) {
        ytPlayerRef.current.play();
      }
      if (roomId && currentPlaying >= 0 && Math.round(newTime) !== Math.round(prevTime)) {
        try {
          await fetch(
            `http://localhost:3001/rooms/${roomId}/queue/${currentPlaying}/most-recent-change`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ state, positionSec: Math.round(newTime) })
            }
          );
        } catch (err) {
          console.error('Most recent change update error', err);
        }
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
    if (!isPlaying && currentPlaying === -1 && queue.length > 0) {
      await updateCurrentPlaying(0);
      setIsPlaying(true);
      setActiveButton('play');
      setTimeout(() => setActiveButton(null), 200);
      return;
    }

    const newState = isPlaying ? 'Paused' : 'Played';
    const positionSec = Math.round((progress / 100) * totalDuration);

    if (roomId && currentPlaying >= 0) {
      try {
        await fetch(`http://localhost:3001/rooms/${roomId}/queue/${currentPlaying}/most-recent-change`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: newState, positionSec })
        });
      } catch (err) {
        console.error('Most recent change update error', err);
      }
    }

    setIsPlaying(!isPlaying);
    setActiveButton('play');
    setTimeout(() => setActiveButton(null), 200);
  };

  const handleSkip = (direction) => {
    let newIndex = currentPlaying;
    if (direction === 'next') {
      newIndex = Math.min(currentPlaying + 1, queue.length - 1);
    } else if (direction === 'prev') {
      if (currentPlaying <= 0) return;
      newIndex = currentPlaying - 1;
    }
    updateCurrentPlaying(newIndex);
    setActiveButton(direction);
    setTimeout(() => setActiveButton(null), 200);
  };

  const handleConfirmLeave = async () => {
    if (!roomId || !currentUserId) return;
    if (isAdmin) {
      try {
        await fetch(`http://localhost:3001/rooms/${roomId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Delete room error', err);
      }
      setRoomEnded(true);
    } else {
      try {
        await fetch(`http://localhost:3001/rooms/${roomId}/remove-user`, {
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
      if (usersAbortRef.current) usersAbortRef.current.abort();
      const controller = new AbortController();
      usersAbortRef.current = controller;
      const res = await fetch(`http://localhost:3001/rooms/${id}/users`, {
        signal: controller.signal,
      });
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
      if (err.name !== 'AbortError') {
        console.error('Fetch users error', err);
      }
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

  useEffect(() => {
    setProgress(0);
    setTotalDuration(0);
  }, [currentPlaying]);

  const currentUser = users.find((u) => u.userId === currentUserId);
  const isAdmin = currentUser?.isAdmin;
  const nowPlaying =
    currentPlaying >= 0 && currentPlaying < queue.length
      ? queue[currentPlaying]
      : null;

  useEffect(() => {
    if (!isAdmin || nowPlaying?.platform !== 'youtube') return;
    const id = setInterval(() => {
      if (isSeeking || !ytPlayerRef.current) return;
      const duration = ytPlayerRef.current.getDuration();
      const current = ytPlayerRef.current.getCurrentTime();
      if (duration > 0) {
        setTotalDuration(duration);
        setProgress((current / duration) * 100);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isAdmin, nowPlaying, isSeeking]);

  return (
    <>
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