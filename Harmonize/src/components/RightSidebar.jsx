import React, { useState, useEffect, useRef } from 'react';
import YouTubeLogo from '../assets/youtube.png';
import SoundCloudLogo from '../assets/soundcloud.svg';
import SpotifyLogo from '../assets/spotify.svg';

const queueData = [
  { albumCover: 'https://via.placeholder.com/60', title: 'Midnight Pulse', artist: 'Luna Waves', serviceLogo: SpotifyLogo, queuedBy: 'Jake' },
  { albumCover: 'https://via.placeholder.com/60', title: 'Skyline Dreams', artist: 'Nova Drive', serviceLogo: YouTubeLogo, queuedBy: 'Sofia' },
  { albumCover: 'https://via.placeholder.com/60', title: 'Neon Nightfall', artist: 'Echo Riders', serviceLogo: SoundCloudLogo, queuedBy: 'Jess' },
  { albumCover: 'https://via.placeholder.com/60', title: 'Synth Horizon', artist: 'Retro Nova', serviceLogo: SpotifyLogo, queuedBy: 'Pranav' },
  { albumCover: 'https://via.placeholder.com/60', title: 'Solar Drift', artist: 'Galaxy Flow', serviceLogo: YouTubeLogo, queuedBy: 'Zane' },
  { albumCover: 'https://via.placeholder.com/60', title: 'Electric Fade', artist: 'Vaporline', serviceLogo: SoundCloudLogo, queuedBy: 'Jake' },
  { albumCover: 'https://via.placeholder.com/60', title: 'Golden Hour', artist: 'Sunset Run', serviceLogo: SpotifyLogo, queuedBy: 'Jess' },
  { albumCover: 'https://via.placeholder.com/60', title: 'Ocean Drive', artist: 'Coral Keys', serviceLogo: YouTubeLogo, queuedBy: 'Sofia' },
  { albumCover: 'https://via.placeholder.com/60', title: 'Pulse Shift', artist: 'Tempo Blaze', serviceLogo: SoundCloudLogo, queuedBy: 'Zane' },
  { albumCover: 'https://via.placeholder.com/60', title: 'Static Bloom', artist: 'Signal Bloom', serviceLogo: SpotifyLogo, queuedBy: 'Pranav' },
];

export default function RightSidebar({isVisible}) {
  const [isOpen, setIsOpen] = useState(true);
  const [width, setWidth] = useState(300);
  const minWidth = 200;
  const maxWidth = 500;
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing.current) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth);
        }
      }
    };

    const stopResize = () => {
      isResizing.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, []);
  return (
    <div
      className="right-sidebar"
      style={{
        width: isVisible ? width : 0,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div
        className="sidebar-left-edge"
        onMouseDown={() => (isResizing.current = true)}
      />
  
      <div className="sidebar-section">
        <h2 className="sidebar-title">Shared Queue</h2>
      </div>
  
      {queueData.map((item, idx) => (
        <div className="queue-card" key={idx}>
          <div className="album-cover-placeholder" />
          <div className="song-info">
            <div className="song-title">{item.title}</div>
            <div className="artist-name">{item.artist}</div>
          </div>
          <div className="service-info">
            <img
              src={item.serviceLogo}
              alt="service"
              style={{ width: 20, height: 20, marginBottom: 4 }}
            />
            <div className="queued-by">{item.queuedBy}</div>
          </div>
        </div>
      ))}
    </div>
  );  
}
