import React, { useState, useEffect } from 'react';

export default function RoomSetupModal({ onClose }) {
  const [mode, setMode] = useState('name'); // 'name', 'choose', 'create', 'join'
  const [userName, setUserName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [services, setServices] = useState({
    YouTube: true,
    Spotify: true,
    SoundCloud: true,
  });

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content setup-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} aria-label="Close Modal">
          &times;
        </button>
        {mode === 'name' && (
          <div className="intro-card">
            <img
              src="/src/assets/logo.png"
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
                  onClick={() => setMode('choose')}
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
              src="/src/assets/logo.png"
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
            <button className="submit-link-button" style={{ marginTop: '1rem' }}>
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
            <button className="submit-link-button" style={{ marginTop: '1rem' }}>
              Join
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
