import React, { useState, useEffect } from 'react';

export default function UsernamePrompt({ onComplete, existingUser }) {
  const [username, setUsername] = useState(existingUser?.username || '');

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onComplete(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onComplete]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    try {
      let userData;
      if (existingUser) {
        const res = await fetch(`/users/${existingUser.userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: trimmed }),
        });
        if (!res.ok) throw new Error('Failed to update');
        userData = { userId: existingUser.userId, username: trimmed };
      } else {
        const res = await fetch('/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: trimmed }),
        });
        if (!res.ok) throw new Error('Failed to create');
        const data = await res.json();
        userData = { userId: data.userId, username: data.username };
      }
      localStorage.setItem('user', JSON.stringify(userData));
      onComplete(userData);
    } catch (err) {
      console.error('Username submission failed', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onComplete(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-button"
          onClick={() => onComplete(null)}
          aria-label="Close Modal"
        >
          &times;
        </button>
        <h2 className="modal-title">
          {existingUser ? 'Change Username' : 'Choose a Username'}
        </h2>
        <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
          <div className="unified-search-wrapper" style={{ maxWidth: '300px', margin: '0 auto' }}>
            <input
              type="text"
              className="unified-search-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="submit-link-button"
            style={{ marginTop: '1rem' }}
            disabled={!username.trim()}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
