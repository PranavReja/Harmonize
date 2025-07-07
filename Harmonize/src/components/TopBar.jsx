import React, { useState, useEffect, useCallback } from 'react';
import SearchResultCard from './SearchResultCard.jsx';
import YouTubeLogo from '../assets/youtube.png';
import SoundCloudLogo from '../assets/soundcloud.svg';
import SpotifyLogo from '../assets/spotify.svg';

export default function TopBar({
  addToQueueTop,
  addToQueueBottom,
  users,
  currentUserId,
  refreshUsers,
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
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

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
        !e.target.closest('.account-dropdown')
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
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}` +
        (pageToken ? `&pageToken=${pageToken}` : '');
      const res = await fetch(url);
      const data = await res.json();
      const results = (data.items || []).map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.default?.url,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
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
        `http://localhost:3001/spotify/search?q=${encodeURIComponent(query)}&offset=${offset}`;
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

  const searchSoundCloud = (query) => {
    if (!query) return;
    const results = Array.from({ length: 10 }, (_, i) => ({
      id: `${query}-sc-${i}`,
      title: `${query} SoundCloud ${i + 1}`,
      artist: `SoundCloud Artist ${i + 1}`,
    }));
    setSoundcloudResults(results);
  };

  const loadMoreSoundCloud = () => {
    const start = soundcloudResults.length;
    const more = Array.from({ length: 10 }, (_, i) => ({
      id: `${searchQuery}-sc-${start + i}`,
      title: `${searchQuery} SoundCloud ${start + i + 1}`,
      artist: `SoundCloud Artist ${start + i + 1}`,
    }));
    setSoundcloudResults((prev) => [...prev, ...more]);
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
  const hasSpotify = currentUser?.services.includes('Spotify');

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
    if (!currentUserId) return;
    const authWindow = window.open(
      `http://localhost:3001/auth/spotify/login?userId=${currentUserId}`,
      '_blank',
      'width=500,height=600'
    );
    const timer = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(timer);
        refreshUsers && refreshUsers();
      }
    }, 1000);
  };

  const handleLinkSubmit = async () => {
    const link = linkInput.trim();
    if (!link) return;
    try {
      const res = await fetch(
        `http://localhost:3001/resolve?link=${encodeURIComponent(link)}`
      );
      const data = await res.json();
      if (!data.error) {
        addToQueueBottom(
          createQueueItem(
            {
              id: data.id,
              title: data.title,
              artist: data.artist,
              thumbnail: data.thumbnail,
            },
            data.service
          )
        );
        setIsLinkModalOpen(false);
        setLinkInput('');
      } else {
        console.error('Link resolve error', data.error);
      }
    } catch (err) {
      console.error('Link submit error', err);
    }
  };

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
          {isAccountMenuOpen && (
            <div className="account-dropdown">
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
              onAdd={() => addToQueueBottom(createQueueItem(r, 'Spotify'))}
              onPlayNext={() => addToQueueTop(createQueueItem(r, 'Spotify'))}
            />
          ))}
        {service === 'SoundCloud' &&
          soundcloudResults.map((r) => (
            <SearchResultCard
              key={r.id}
              title={r.title}
              artist={r.artist}
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