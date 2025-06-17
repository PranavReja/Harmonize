import TopBar from './components/TopBar';
import './styles.css';
import React, { useState, useRef, useEffect } from 'react';
import RightSidebar from './components/RightSidebar';
import UserCard from './components/UserCard';
import RoomSetupModal from './components/RoomSetupModal.jsx';
import YouTubeLogo from './assets/youtube.png';
import SoundCloudLogo from './assets/soundcloud.svg';
import SpotifyLogo from './assets/spotify.svg';

function App() {
  const [isLeftSidebarVisible, setIsLeftSidebarVisible] = useState(true);
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
  const [leftWidth, setLeftWidth] = useState(240);
  const minLeftWidth = 180;
  const maxLeftWidth = 400;
  const [showRoomModal, setShowRoomModal] = useState(true);

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

  useEffect(() => {
    const setupRoom = async () => {
      const prev = localStorage.getItem('roomId');
      if (prev) {
        try {
          await fetch(`http://localhost:3001/rooms/${prev}`, { method: 'DELETE' });
        } catch (err) {
          console.error('delete room error', err);
        }
      }

      try {
        const res = await fetch('http://localhost:3001/rooms/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'spotify' }),
        });
        const data = await res.json();
        const id = data.roomId;
        setRoomId(id);
        localStorage.setItem('roomId', id);
        fetchQueue(id);
      } catch (err) {
        console.error('create room error', err);
      }
    };

    setupRoom();
  }, []);

  const songTitle = 'Song Name 🎵';
  const totalDuration = 200;

  const [progress, setProgress] = useState(40);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeButton, setActiveButton] = useState(null);

  const progressBarRef = useRef(null);

  const users = [
    {
      name: '🎧 Pranav (Admin)',
      admin: true,
      profilePic: 'https://via.placeholder.com/60',
      services: ['Spotify', 'YouTube'],
    },
    {
      name: 'Sofia',
      profilePic: 'https://via.placeholder.com/60',
      services: ['YouTube'],
    },
    {
      name: 'Jake',
      profilePic: 'https://via.placeholder.com/60',
      services: ['SoundCloud', 'Spotify'],
    },
    {
      name: 'Jess',
      profilePic: 'https://via.placeholder.com/60',
      services: ['SoundCloud'],
    },
    {
      name: 'Zane',
      profilePic: 'https://via.placeholder.com/60',
      services: ['Spotify'],
    },
  ];

  const [roomId, setRoomId] = useState(null);
  const [queue, setQueue] = useState([]);

  const getServiceLogo = (platform) => {
    if (platform === 'spotify') return SpotifyLogo;
    if (platform === 'youtube') return YouTubeLogo;
    return SoundCloudLogo;
  };

  const fetchQueue = async (id = roomId) => {
    if (!id) return;
    try {
      const res = await fetch(`http://localhost:3001/rooms/${id}/queue`);
      const data = await res.json();
      const items = (data.queue || []).map((song) => ({
        id: song.position.toString(),
        title: song.title,
        artist: song.artist,
        platform: song.platform,
        sourceId: song.sourceId,
        serviceLogo: getServiceLogo(song.platform),
        albumCover: 'https://via.placeholder.com/60',
        queuedBy: song.addedBy,
      }));
      setQueue(items);
    } catch (err) {
      console.error('fetch queue error', err);
    }
  };

  const addSong = async (item, playNext = false) => {
    if (!roomId) return;
    const endpoint = playNext ?
      `/rooms/${roomId}/queue/next` :
      `/rooms/${roomId}/queue`;
    try {
      await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          artist: item.artist,
          platform: item.platform,
          sourceId: item.sourceId,
          addedBy: 'frontend',
        }),
      });
      fetchQueue();
    } catch (err) {
      console.error('add song error', err);
    }
  };

  const addToQueueTop = (item) => addSong(item, true);
  const addToQueueBottom = (item) => addSong(item, false);

  const handleSeekStart = (e) => {
    setIsSeeking(true);
    updateSeek(e);
  };

  const handleSeekMove = (e) => {
    if (isSeeking) updateSeek(e);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
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

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    setActiveButton('play');
    setTimeout(() => setActiveButton(null), 200);
  };

  const handleSkip = (direction) => {
    setActiveButton(direction);
    setTimeout(() => setActiveButton(null), 200);
  };

  return (
    <>
      {showRoomModal && <RoomSetupModal onClose={() => setShowRoomModal(false)} />}
      <TopBar addToQueueTop={addToQueueTop} addToQueueBottom={addToQueueBottom} />
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
              <h2 className="sidebar-title">Room: Harmonize HQ</h2>
              <button className="copy-button">Room Invite Link</button>
            </div>
            <div className="sidebar-section">
              <h3 className="sidebar-subtitle">Listeners</h3>
              <ul className="user-list">
                {users.map((u) => (
                  <UserCard key={u.name} user={u} />
                ))}
              </ul>
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
                <div className="cover-placeholder">Album Cover</div>
              </div>

              <div className="now-playing-text">
                <div className="now-playing-title">{songTitle}</div>
                <div className="now-playing-artist">Artist Name</div>
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
                <button className={`skip-button ${activeButton === 'prev' ? 'active' : ''}`} onClick={() => handleSkip('prev')}>
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
          />
        </div>

      </div>
    </>
  );
}

export default App;