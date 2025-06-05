import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import YouTubeLogo from '../assets/youtube.png';
import SoundCloudLogo from '../assets/soundcloud.svg';
import SpotifyLogo from '../assets/spotify.svg';
import SortableQueueItem from './SortableQueueItem.jsx';

const initialQueue = [
  { id: '1', albumCover: 'https://via.placeholder.com/60', title: 'Midnight Pulse', artist: 'Luna Waves', serviceLogo: SpotifyLogo, queuedBy: 'Jake' },
  { id: '2', albumCover: 'https://via.placeholder.com/60', title: 'Skyline Dreams', artist: 'Nova Drive', serviceLogo: YouTubeLogo, queuedBy: 'Sofia' },
  { id: '3', albumCover: 'https://via.placeholder.com/60', title: 'Neon Nightfall', artist: 'Echo Riders', serviceLogo: SoundCloudLogo, queuedBy: 'Jess' },
  { id: '4', albumCover: 'https://via.placeholder.com/60', title: 'Synth Horizon', artist: 'Retro Nova', serviceLogo: SpotifyLogo, queuedBy: 'Pranav' },
  { id: '5', albumCover: 'https://via.placeholder.com/60', title: 'Solar Drift', artist: 'Galaxy Flow', serviceLogo: YouTubeLogo, queuedBy: 'Zane' },
  { id: '6', albumCover: 'https://via.placeholder.com/60', title: 'Electric Fade', artist: 'Vaporline', serviceLogo: SoundCloudLogo, queuedBy: 'Jake' },
  { id: '7', albumCover: 'https://via.placeholder.com/60', title: 'Golden Hour', artist: 'Sunset Run', serviceLogo: SpotifyLogo, queuedBy: 'Jess' },
  { id: '8', albumCover: 'https://via.placeholder.com/60', title: 'Ocean Drive', artist: 'Coral Keys', serviceLogo: YouTubeLogo, queuedBy: 'Sofia' },
  { id: '9', albumCover: 'https://via.placeholder.com/60', title: 'Pulse Shift', artist: 'Tempo Blaze', serviceLogo: SoundCloudLogo, queuedBy: 'Zane' },
  { id: '10', albumCover: 'https://via.placeholder.com/60', title: 'Static Bloom', artist: 'Signal Bloom', serviceLogo: SpotifyLogo, queuedBy: 'Pranav' },
];

export default function RightSidebar({isVisible}) {
  const [width, setWidth] = useState(300);
  const minWidth = 200;
  const maxWidth = 500;
  const isResizing = useRef(false);
  const [queue, setQueue] = useState(initialQueue);

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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQueue((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  return (
    <div
      className="right-sidebar"
      style={{
        width: isVisible ? width : 0,
        minWidth: isVisible ? minWidth : 0,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div
        className="sidebar-left-edge"
        onMouseDown={() => (isResizing.current = true)}
      />

      <div className="sidebar-section">
        <h2 className="sidebar-title">Shared Queue</h2>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={queue.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          {queue.map((item) => (
            <SortableQueueItem key={item.id} id={item.id} item={item} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
