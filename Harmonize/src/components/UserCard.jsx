import React, { useState } from 'react';
import YouTubeLogo from '../assets/youtube.png';
import SoundCloudLogo from '../assets/soundcloud.svg';
import SpotifyLogo from '../assets/spotify.svg';

const logoMap = {
  YouTube: YouTubeLogo,
  SoundCloud: SoundCloudLogo,
  Spotify: SpotifyLogo,
};

export default function UserCard({ user }) {
  const [open, setOpen] = useState(false);

  const handleClick = () => setOpen((v) => !v);
  const handleContextMenu = (e) => {
    e.preventDefault();
    setOpen(true);
  };

  return (
    <li
      className={`user ${user.admin ? 'admin' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div className="user-icon">
        <div className="head"></div>
        <div className="body"></div>
      </div>
      <span className="username">{user.name}</span>
      {open && (
        <div className="contact-card" onClick={(e) => e.stopPropagation()}>
          <div className="contact-photo">
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
