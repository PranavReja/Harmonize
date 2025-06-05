import React, { useState, useEffect } from 'react';
import SearchResultCard from './SearchResultCard.jsx';

export default function TopBar() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hardcoded for now; can be updated dynamically later
const activeServices = ['YouTube', 'Spotify', 'SoundCloud']; // 👈 change this array to control visible columns


  return (
    <>
      <header className="top-bar">
        <div className="logo">
          <img src="/src/assets/logo.png" alt="Harmonize Logo" className="logo-image" />
          <span className="logo-text">Harmonize</span>
        </div>

        {/* Center: Unified Search Bar */}
        <div className="search-group-wrapper">
          <div className="unified-search-wrapper">
          <input
  type="text"
  placeholder="Search music..."
  className="unified-search-input"
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      setIsModalOpen(true);
    }
  }}
/>
            <span
              className="search-icon"
              onClick={() => setIsModalOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              🔍
            </span>
          </div>
        </div>

        {/* Right: Buttons */}
        <div className="topbar-right">
          <button className="copy-button">Insert Music Links</button>
          <button className="icon-button settings-button" aria-label="Settings">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </button>
          <button className="icon-button account-button" aria-label="Account">
            <div className="head"></div>
            <div className="body"></div>
          </button>
        </div>
      </header>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button
  className="modal-close-button"
  onClick={() => setIsModalOpen(false)}
  aria-label="Close Modal"
>
  ×
</button>



          <div className="modal-title">
            <div className="unified-search-wrapper">
              <input
                type="text"
                placeholder="Search music..."
                className="unified-search-input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsModalOpen(true);
                  }
                }}
              />
              <span
                className="search-icon"
                onClick={() => setIsModalOpen(true)}
                style={{ cursor: 'pointer' }}
              >
                🔍
              </span>
            </div>
          </div>
  <div className="multi-column-results">
    {activeServices.map((service) => (
      <div key={service} className="service-column">
        <h3 className="service-header">{service}</h3>
        {Array.from({ length: 10 }, (_, i) => (
          <SearchResultCard
            key={i}
            title={`${service} ${i + 1}`}
            artist={`${service} Artist ${i + 1}`}
            service={service}
            onAdd={() => {}}
            onPlayNext={() => {}}
          />
        ))}
      </div>
    ))}
  </div>

                </div>
     
            </div>
      
           )}
    </>
  );
}