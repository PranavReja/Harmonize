import React, { useState, useEffect, useRef } from 'react';
import YouTubeLogo from '../assets/youtube.png';
import SoundCloudLogo from '../assets/soundcloud.svg';
import SpotifyLogo from '../assets/spotify.svg';

const logoMap = {
  YouTube: YouTubeLogo,
  SoundCloud: SoundCloudLogo,
  Spotify: SpotifyLogo,
};

export default function UserCard({ user, isCurrent }) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef(null);
  const toggle = () => setOpen((v) => !v);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [open]);

  return (
    <li
      ref={cardRef}
      className={`user ${user.admin ? 'admin' : ''} ${isCurrent ? 'current' : ''}`}
      onPointerDown={toggle}
    >
      <div className="user-icon">
        <div className="head"></div>
        <div className="body"></div>
      </div>
      <span className="username">{user.name}</span>
      {open && (
        <div className="contact-card" onPointerDown={(e) => e.stopPropagation()}>
          <div className="contact-icon">
            <div className="head"></div>
            <div className="body"></div>
          </div>
          <div className="contact-name">{user.name}</div>
          <div className="contact-services">
            {user.services.map((s) => (
              <img
                key={s}
                src={logoMap[s]}
                alt={s}
                className="service-logo"
              />
            ))}
          </div>
        </div>
      )}
    </li>
  );
}
