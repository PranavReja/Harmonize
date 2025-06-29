import TopBar from './components/TopBar';
import './styles.css';
import React, { useState, useRef, useEffect } from 'react';
import RightSidebar from './components/RightSidebar';
import UserCard from './components/UserCard';
import RoomSetupModal from './components/RoomSetupModal.jsx';

function App() {
  const [isLeftSidebarVisible, setIsLeftSidebarVisible] = useState(true);
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
  const [leftWidth, setLeftWidth] = useState(240);
  const minLeftWidth = 180;
  const maxLeftWidth = 400;
  const [showRoomModal, setShowRoomModal] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [roomName, setRoomName] = useState('');

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

  useEffect(() => {
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

  const songTitle = 'Song Name 🎵';
  const totalDuration = 200;

  const [progress, setProgress] = useState(40);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeButton, setActiveButton] = useState(null);

  const progressBarRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const initialQueue = [];

  const [queue, setQueue] = useState(initialQueue);

  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [roomEnded, setRoomEnded] = useState(false);

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
      const res = await fetch(`http://localhost:3001/rooms/${id}/users`);
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
  };

  useEffect(() => {
    if (roomId) {
      fetchRoomUsers(roomId);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const id = setInterval(() => {
      fetchRoomUsers(roomId, true).then((ok) => {
        if (!ok) setRoomEnded(true);
      });
    }, 5000);
    return () => clearInterval(id);
  }, [roomId]);

  const currentUser = users.find((u) => u.userId === currentUserId);
  const isAdmin = currentUser?.isAdmin;

  return (
    <>
      {showRoomModal && (
        <RoomSetupModal
          onClose={() => setShowRoomModal(false)}
          onRoomJoined={handleRoomJoined}
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
              <h2 className="sidebar-title">Room: {roomName || 'Not Connected'}</h2>
              <button className="copy-button" disabled={!roomId}>Room Invite Link</button>
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