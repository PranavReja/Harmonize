export default function TopBar() {
  return (
    <header className="top-bar">
<div className="logo">
  <img src="/src/assets/logo.png" alt="Harmonize Logo" className="logo-image" />
  <span className="logo-text">Harmonize</span>
</div>


      {/* Center: Search Bars */}
      <div className="search-group-wrapper">
      <div className="search-group">
  {/* YouTube Search */}
  <div className="shimmer-wrapper youtube-shimmer">
    <div className="search-wrapper">
      <input
        type="text"
        placeholder="Search YouTube"
        className="search-with-icon"
      />
      <span className="search-icon">🔍</span>
    </div>
  </div>

  {/* Spotify Search */}
  <div className="shimmer-wrapper spotify-shimmer">
    <div className="search-wrapper">
      <input
        type="text"
        placeholder="Search Spotify"
        className="search-with-icon"
      />
      <span className="search-icon">🔍</span>
    </div>
  </div>

  {/* SoundCloud Search */}
  <div className="shimmer-wrapper soundcloud-shimmer">
    <div className="search-wrapper">
      <input
        type="text"
        placeholder="Search SoundCloud"
        className="search-with-icon"
      />
      <span className="search-icon">🔍</span>
    </div>
  </div>
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
  );
}
