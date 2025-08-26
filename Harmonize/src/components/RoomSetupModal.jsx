import React, { useState, useEffect, useRef } from 'react';
import HarmonizeLogo from '../assets/logo.png';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001';

export default function RoomSetupModal({ onClose, onRoomJoined, joinRoomId }) {
  const [mode, setMode] = useState('name'); // 'name', 'choose', 'create', 'join'
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [services, setServices] = useState({
    YouTube: true,
    Spotify: true,
    SoundCloud: true,
  });
  const defaultRoomName = userName ? `${userName}'s Listening Room` : '';
  const roomNameInputRef = useRef(null);

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    const savedId = localStorage.getItem('userId');
    if (savedName) setUserName(savedName);
    if (savedId) setUserId(savedId);
  }, []);

  // Set default room name when entering the create mode
  useEffect(() => {
    if (mode === 'create') {
      setRoomName(defaultRoomName);
    }
  }, [mode, userName, defaultRoomName]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const toggleService = (name) => {
    setServices((s) => ({ ...s, [name]: !s[name] }));
  };

  useEffect(() => {
    setError('');
  }, [mode]);

  const handleContinue = async () => {
    setError('');
    let id = userId;
    try {
      if (!id) {
        const res = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: userName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create user');
        id = data.userId;
        setUserId(id);
      } else if (userName !== localStorage.getItem('userName')) {
        await fetch(`${API_URL}/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: userName })
        });
      }

      localStorage.setItem('userId', id);
      localStorage.setItem('userName', userName);

      if (joinRoomId) {
        const resJoin = await fetch(`${API_URL}/rooms/${joinRoomId}/join`, { method: 'POST' });
        const dataJoin = await resJoin.json();
        if (!resJoin.ok) throw new Error(dataJoin.error || 'Room not found');
        await joinUserToRoom(joinRoomId, id);
        onRoomJoined?.(joinRoomId, dataJoin.roomName, id, userName);
        onClose();
      } else {
        setMode('choose');
      }
    } catch (err) {
      console.error('User create error', err);
      setError(err.message || 'Failed to continue');
    }
  };

  const joinUserToRoom = async (id, uid = userId) => {
    if (!uid) return;
    try {
      await fetch(`${API_URL}/rooms/${id}/join-user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, username: userName })
      });
    } catch (err) {
      console.error('Join user error', err);
    }
  };

  const handleRoomNameFocus = (e) => {
    if (roomName === defaultRoomName) {
      e.target.select();
    }
  };

  const handleCreate = async () => {
    setError('');
    const mode = services.Spotify ? 'spotify' : 'guest';
    try {
      const res = await fetch(`${API_URL}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, name: roomName })
      });
      const data = await res.json();
      if (res.ok) {
        await joinUserToRoom(data.roomId, userId);
        onRoomJoined?.(data.roomId, data.roomName, userId, userName);
        onClose();
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('Create room error', err);
      setError('Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/rooms/${roomCode}/join`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        await joinUserToRoom(roomCode, userId);
        onRoomJoined?.(roomCode, data.roomName, userId, userName);
        onClose();
      } else {
        setError(data.error || 'Room not found');
      }
    } catch (err) {
      console.error('Join room error', err);
      setError('Failed to join room');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content setup-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} aria-label="Close Modal">
          &times;
        </button>
        {mode === 'name' && (
          <div className="intro-card">
            <img
              src={HarmonizeLogo}
              alt="Harmonize Logo"
              className="intro-logo"
            />
            <h2 className="intro-title">Welcome to Harmonize</h2>
            <div className="intro-buttons">
              <div className="link-input-group">
                <div className="unified-search-wrapper" style={{ maxWidth: '220px', marginRight: '12px' }}>
                  <input
                    type="text"
                    className="unified-search-input"
                    placeholder="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  className="submit-link-button"
                  onClick={handleContinue}
                  disabled={!userName.trim()}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
        {mode === 'choose' && (
          <div className="intro-card">
            <img
              src={HarmonizeLogo}
              alt="Harmonize Logo"
              className="intro-logo"
            />
            <h2 className="intro-title">Welcome to Harmonize</h2>
            <div className="intro-buttons">
              <button
                className="submit-link-button"
                onClick={() => setMode('create')}
              >
                Create Listening Room
              </button>
              <button
                className="submit-link-button"
                onClick={() => setMode('join')}
              >
                Join Listening Room
              </button>
            </div>
          </div>
        )}
        {mode === 'create' && (
          <div className="create-room-form">
            <h2 className="modal-title">Create Listening Room</h2>
            <div className="unified-search-wrapper" style={{ maxWidth: '300px', margin: '0 auto' }}>
              <input
                type="text"
                className="unified-search-input"
                placeholder="Room Name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onFocus={handleRoomNameFocus}
                ref={roomNameInputRef}
              />
            </div>
            <div className="service-checkboxes">
              {Object.keys(services).map((name) => (
                <label key={name}>
                  <input
                    type="checkbox"
                    checked={services[name]}
                    onChange={() => toggleService(name)}
                  />
                  {name}
                </label>
              ))}
            </div>
            {error && <div className="error-text">{error}</div>}
            <button
              className="submit-link-button"
              style={{ marginTop: '1rem' }}
              onClick={handleCreate}
            >
              Create
            </button>
          </div>
        )}
        {mode === 'join' && (
          <div className="join-room-form">
            <h2 className="modal-title">Join Listening Room</h2>
            <div className="unified-search-wrapper" style={{ maxWidth: '300px', margin: '0 auto' }}>
              <input
                type="text"
                className="unified-search-input"
                placeholder="Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button
              className="submit-link-button"
              style={{ marginTop: '1rem' }}
              onClick={handleJoinRoom}
              disabled={roomCode.length !== 6}
            >
              Join
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
