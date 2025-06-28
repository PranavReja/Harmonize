import TopBar from './components/TopBar';
import './styles.css';
import React, { useState, useRef, useEffect } from 'react';
import RightSidebar from './components/RightSidebar';
import UserCard from './components/UserCard';
import RoomSetupModal from './components/RoomSetupModal.jsx';
import UsernamePrompt from './components/UsernamePrompt.jsx';
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
  const [user, setUser] = useState(null);
  const [showUserPrompt, setShowUserPrompt] = useState(false);

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
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse stored user', err);
        setShowUserPrompt(true);
      }
    } else {
      setShowUserPrompt(true);
    }
  }, []);

  const songTitle = 'Song Name 🎵';
  const totalDuration = 200;

  const [progress, setProgress] = useState(40);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeButton, setActiveButton] = useState(null);

  const progressBarRef = useRef(null);

  const users = user
    ? [
        {
          name: user.username,
          admin: false,
          services: [],
        },
      ]
    : [];

  const initialQueue = [];

  const [queue, setQueue] = useState(initialQueue);

  const addToQueueTop = (item) => setQueue((prev) => [item, ...prev]);
  const addToQueueBottom = (item) => setQueue((prev) => [...prev, item]);

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

  const handleUserComplete = (data) => {
    if (data) setUser(data);
    setShowUserPrompt(false);
  };

  return (
    <>
      {showUserPrompt && (
        <UsernamePrompt existingUser={user} onComplete={handleUserComplete} />
      )}
      {showRoomModal && (
        <RoomSetupModal
          onClose={() => setShowRoomModal(false)}
          defaultRoomName={user ? `${user.username}'s Room` : ''}
        />
      )}
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
              <button className="copy-button" onClick={() => setShowUserPrompt(true)}>
                Change Username
              </button>
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
          />
        </div>

      </div>
    </>
  );
}

export default App;