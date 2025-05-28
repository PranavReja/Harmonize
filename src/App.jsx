import TopBar from './components/TopBar';
import './styles.css';
import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  const songTitle = 'Song Name 🎵';

  const [progress, setProgress] = useState(40);
  const [isSeeking, setIsSeeking] = useState(false);
  const progressBarRef = useRef(null);

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

  const totalDuration = 200;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const [isPlaying, setIsPlaying] = useState(true);
  const [activeButton, setActiveButton] = useState(null);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    setActiveButton('play');
    setTimeout(() => setActiveButton(null), 200);
  };

  const handleSkip = (direction) => {
    console.log(`${direction} track`);
    setActiveButton(direction);
    setTimeout(() => setActiveButton(null), 200);
  };

  useEffect(() => {
    const resizers = document.querySelectorAll('.resizer-bar');
    let startX, startWidth, currentSidebar;

    resizers.forEach(resizer => {
      resizer.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        currentSidebar = resizer.classList.contains('left-resizer')
          ? document.querySelector('.left-sidebar')
          : null;
        startWidth = currentSidebar.offsetWidth;
        document.addEventListener('mousemove', resizeSidebar);
        document.addEventListener('mouseup', stopResize);
      });
    });

    const resizeSidebar = (e) => {
      const dx = e.clientX - startX;
      if (currentSidebar) {
        currentSidebar.style.width = `${startWidth + dx}px`;
      }
    };

    const stopResize = () => {
      document.removeEventListener('mousemove', resizeSidebar);
      document.removeEventListener('mouseup', stopResize);
    };

    return () => stopResize();
  }, []);

  return (
    <>
      <TopBar />

      <div className="app-layout">
        {/* Left Sidebar with resizer */}
        <div className={`resizable sidebar left-sidebar ${isSidebarVisible ? '' : 'hidden'}`}>
          <div className="sidebar-section">
            <h2 className="sidebar-title">Room: Harmonize HQ</h2>
            <button className="copy-button">Room Invite Link</button>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-subtitle">Listeners</h3>
            <ul className="user-list">
              {['🎧 Pranav (Admin)', 'Sofia', 'Jake', 'Jess', 'Zane'].map((name, idx) => (
                <li className={`user ${idx === 0 ? 'admin' : ''}`} key={name}>
                  <div className="user-icon">
                    <div className="head"></div>
                    <div className="body"></div>
                  </div>
                  <span className="username">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`resizer-bar left-resizer ${isSidebarVisible ? '' : 'hidden'}`}></div>

        {/* Main area */}
        <div className="main-area">
          <button className="toggle-sidebar-button" onClick={toggleSidebar}>
            {isSidebarVisible ? '←' : '→'}
          </button>
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
                  <span className="current-time">{formatTime(progress / 100 * totalDuration)}</span>
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
          </main>
        </div>
      </div>
    </>
  );
}

export default App;