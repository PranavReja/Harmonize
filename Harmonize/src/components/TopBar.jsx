import React, { useState, useEffect, useCallback } from 'react';
import SearchResultCard from './SearchResultCard.jsx';
import YouTubeLogo from '../assets/youtube.png';
import SoundCloudLogo from '../assets/soundcloud.svg';
import SpotifyLogo from '../assets/spotify.svg';
import HarmonizeLogo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AccountIcon = () => (
  <div className="icon-button account-button" style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 4px' }}>
    <div className="head"></div>
    <div className="body"></div>
  </div>
);

export default function TopBar({
  addToQueueTop,
  addToQueueBottom,
  users,
  currentUserId,
  refreshUsers,
  showBanner,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [soundcloudResults, setSoundcloudResults] = useState([]);
  const [youtubeNextPageToken, setYoutubeNextPageToken] = useState(null);
  

  const executeSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    searchYouTube(trimmed);
    searchSpotify(trimmed);
    searchSoundCloud(trimmed);
  }, [searchQuery]);

  const openSearchModal = () => {
    if (searchQuery.trim()) {
      setIsModalOpen(true);
    }
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsLinkModalOpen(false);
        setIsAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        !e.target.closest('.account-button') &&
        !e.target.closest('.account-popup')
      ) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const handler = setTimeout(() => {
      if (searchQuery.trim()) {
        executeSearch();
      } else {
        setYoutubeResults([]);
        setSpotifyResults([]);
        setSoundcloudResults([]);
        setYoutubeNextPageToken(null);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, isModalOpen, executeSearch]);

  const searchYouTube = async (query, pageToken = '') => {
    if (!query) return;
    try {
      const url =
        `${API_URL}/youtube/search?q=${encodeURIComponent(query)}` +
        (pageToken ? `&pageToken=${pageToken}` : '');
      const res = await fetch(url);
      const data = await res.json();
      const results = (data.videos || []).map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.channelTitle,
        thumbnail: item.thumbnail,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      }));
      setYoutubeNextPageToken(data.nextPageToken || null);
      if (pageToken) {
        setYoutubeResults((prev) => [...prev, ...results]);
      } else {
        setYoutubeResults(results);
      }
    } catch (err) {
      console.error('YouTube search error', err);
    }
  };

  const loadMoreYouTube = () => {
    if (youtubeNextPageToken) {
      searchYouTube(searchQuery, youtubeNextPageToken);
    }
  };
  const searchSpotify = async (query, offset = 0) => {
    if (!query) return;
    try {
      const url =
        `${API_URL}/spotify/search?q=${encodeURIComponent(query)}&offset=${offset}`;
      const res = await fetch(url);
      const data = await res.json();
      const tracks = data.tracks || [];
      if (offset) {
        setSpotifyResults((prev) => [...prev, ...tracks]);
      } else {
        setSpotifyResults(tracks);
      }
    } catch (err) {
      console.error('Spotify search error', err);
    }
  };

  const loadMoreSpotify = () => {
    const offset = spotifyResults.length;
    searchSpotify(searchQuery, offset);
  };

  const searchSoundCloud = async (query, offset = 0) => {
    if (!query) return;
    try {
      const url = `${API_URL}/soundcloud/search?q=${encodeURIComponent(query)}&offset=${offset}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || 'SoundCloud search failed');
      }
      const tracks = await res.json();
      
      if (offset) {
        setSoundcloudResults((prev) => [...prev, ...tracks]);
      } else {
        setSoundcloudResults(tracks);
      }
    } catch (err) {
      console.error('SoundCloud search error', err);
    }
  };

  const loadMoreSoundCloud = () => {
    const offset = soundcloudResults.length;
    searchSoundCloud(searchQuery, offset);
  };

const handleShowMore = (service) => {
  if (service === 'YouTube') loadMoreYouTube();
  if (service === 'Spotify') loadMoreSpotify();
  if (service === 'SoundCloud') loadMoreSoundCloud();
};

// Hardcoded for now; can be updated dynamically later
const activeServices = ['YouTube', 'Spotify', 'SoundCloud']; // 👈 change this array to control visible columns

  const serviceLogoMap = {
    YouTube: YouTubeLogo,
    Spotify: SpotifyLogo,
    SoundCloud: SoundCloudLogo,
  };

  const getCurrentUserName = () => {
    const user = users.find((u) => u.userId === currentUserId);
    return user?.username || 'Unknown';
  };

  const currentUser = users.find((u) => u.userId === currentUserId);
  const hasSpotify = currentUser?.services?.spotify?.connected;

  const createQueueItem = (result, service) => ({
    id: Date.now().toString(),
    albumCover: result.thumbnail || 'https://via.placeholder.com/60',
    title: result.title,
    artist: result.artist,
    serviceLogo: serviceLogoMap[service],
    queuedBy: getCurrentUserName(),
    platform: service.toLowerCase(),
    sourceId: result.id || null,
  });

  const handleLinkSpotify = () => {
    if (!currentUserId) {
      console.error("No user ID available for Spotify link.");
      return;
    }
    // Redirect to the backend login route
    window.location.href = `${API_URL}/auth/spotify/login?userId=${currentUserId}`;
  };

  

  const handleLinkSubmit = async () => {
    const link = linkInput.trim();
    if (!link) return;
    try {
      const res = await fetch(
        `${API_URL}/resolve?link=${encodeURIComponent(link)}`
      );
      const data = await res.json();
      if (!data.error) {
        const item = createQueueItem(
          {
            id: data.id,
            title: data.title,
            artist: data.artist,
            thumbnail: data.thumbnail,
          },
          data.service
        );
        addToQueueBottom(item);
        showBanner(`Added to queue: ${item.title}`);
        setIsLinkModalOpen(false);
        setLinkInput('');
      } else {
        console.error('Link resolve error', data.error);
      }
    } catch (err) {
      console.error('Link submit error', err);
    }
  };

  const handleAddSpotify = (r) => {
    if (currentUser?.isAdmin && !hasSpotify) {
      showBanner(
        <span>
          Click the <AccountIcon /> button and link Spotify to listen to Spotify songs.
        </span>
      );
    } else {
      addToQueueBottom(createQueueItem(r, 'Spotify'));
    }
  };

  const handlePlayNextSpotify = (r) => {
    if (currentUser?.isAdmin && !hasSpotify) {
      showBanner(
        <span>
          Click the <AccountIcon /> button and link Spotify to listen to Spotify songs.
        </span>
      );
    } else {
      addToQueueTop(createQueueItem(r, 'Spotify'));
    }
  };

  return (
    <>
      <header className="top-bar">
        <div className="logo">
          <img src={HarmonizeLogo} alt="Harmonize Logo" className="logo-image" />
          <span className="logo-text">Harmonize</span>
        </div>

        {/* Center: Unified Search Bar */}
        <div className="search-group-wrapper">
          <div className="unified-search-wrapper">
          <input
            type="text"
            placeholder="Search music..."
            className="unified-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                openSearchModal();
              }
            }}
          />
            <span
              className="search-icon"
              style={{ cursor: 'pointer' }}
            >
              🔍
            </span>
          </div>
        </div>

        {/* Right: Buttons */}
        <div className="topbar-right">
          <button className="copy-button" onClick={() => setIsLinkModalOpen(true)}>
            Insert Music Links
          </button>
          <button
            className="icon-button account-button"
            aria-label="Account"
            onClick={() => setIsAccountMenuOpen((p) => !p)}
          >
            <div className="head"></div>
            <div className="body"></div>
          </button>
        </div>
      </header>

      {isAccountMenuOpen && (
        <div className="account-popup">
          {!hasSpotify && (
            <button className="dropdown-item" onClick={handleLinkSpotify}>
              <img
                src={SpotifyLogo}
                alt="Spotify"
                style={{ width: 20, height: 20 }}
              />
              Link Spotify
            </button>
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <button
              className="modal-close-button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close Modal"
            >
              ×
            </button>
            <div className="search-bar-container">
              <div className="unified-search-wrapper">
                <input
                  type="text"
                  placeholder="Search music..."
                  className="unified-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeSearch();
                    }
                  }}
                />
                <span
                  className="search-icon"
                  onClick={() => {
                    executeSearch();
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  🔍
                </span>
              </div>
            </div>
            <div className="modal-label">
              <div className="icon-label-button1">
              <button className="add-to-queue-button" onClick={() => console.log('Add to Queue Clicked')}>+</button>
                <span className="action-label">Add to Queue</span>
              </div>
              <div className="icon-label-button2">
                <button className="play-next-button" onClick={() => console.log('Add to Queue Clicked')}>
                →
                </button>
                <span className="action-label">Play Next</span>
              </div>
            </div>
          </div>
  <div className="multi-column-results">
    {activeServices.map((service) => (
      <div key={service} className="service-column">
        <h3 className="service-header">{service}</h3>
        {service === 'YouTube' &&
          youtubeResults.map((r) => (
            <SearchResultCard
              key={r.id}
              title={r.title}
              artist={r.artist}
              thumbnail={r.thumbnail}
              url={r.url}
              onAdd={() => addToQueueBottom(createQueueItem(r, 'YouTube'))}
              onPlayNext={() => addToQueueTop(createQueueItem(r, 'YouTube'))}
            />
          ))}
        {service === 'Spotify' &&
          spotifyResults.map((r) => (
            <SearchResultCard
              key={r.id}
              title={r.title}
              artist={r.artist}
              thumbnail={r.thumbnail}
              url={r.url}
              onAdd={() => handleAddSpotify(r)}
              onPlayNext={() => handlePlayNextSpotify(r)}
            />
          ))}
        {service === 'SoundCloud' &&
          soundcloudResults.map((r) => (
            <SearchResultCard
              key={r.id}
              title={r.title}
              artist={r.artist}
              thumbnail={r.thumbnail}
              url={r.url}
              onAdd={() => addToQueueBottom(createQueueItem(r, 'SoundCloud'))}
              onPlayNext={() => addToQueueTop(createQueueItem(r, 'SoundCloud'))}
            />
          ))}
        <button
          className="show-more-button"
          onClick={() => handleShowMore(service)}
        >
          Show More
        </button>
      </div>
    ))}
  </div>

                </div>

            </div>

           )}
      {isLinkModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLinkModalOpen(false)}>
          <div
            className="modal-content link-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-button"
              onClick={() => setIsLinkModalOpen(false)}
              aria-label="Close Modal"
            >
              ×
            </button>
            <div className="link-input-group">
              <div className="unified-search-wrapper" style={{ maxWidth: '600px', marginRight: '12px' }}>
                <input
                  type="text"
                  placeholder="Paste music link..."
                  className="unified-search-input"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  autoFocus
                />
              </div>
              <button className="submit-link-button" onClick={handleLinkSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}