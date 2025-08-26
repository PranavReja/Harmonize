import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import SortableQueueItem from './SortableQueueItem.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function RightSidebar({
  isVisible,
  queue,
  setQueue,
  roomId,
  fetchRoomQueue,
  currentPlaying,
}) {
  const [width, setWidth] = useState(300);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const minWidth = 200;
  const maxWidth = 500;
  const isResizing = useRef(false);

  const upcomingQueue = queue.filter((q) => q.position > currentPlaying);

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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let oldIndex;
    let newIndex;
    setQueue((items) => {
      oldIndex = items.findIndex((i) => i.id === active.id);
      newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });

    if (roomId != null) {
      try {
        await fetch(`${API_URL}/rooms/${roomId}/queue/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceIndex: oldIndex, destinationIndex: newIndex }),
        });
      } catch (err) {
        console.error('Reorder queue error', err);
      }
      fetchRoomQueue(roomId);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (!roomId) return;
    const itemsToDelete = queue
      .filter((i) => selectedIds.has(i.id))
      .sort((a, b) => b.position - a.position);
    for (const item of itemsToDelete) {
      try {
        await fetch(
          `${API_URL}/rooms/${roomId}/queue/${item.position}`,
          { method: 'DELETE' }
        );
      } catch (err) {
        console.error('Delete queue item error', err);
      }
    }
    setSelectedIds(new Set());
    setSelectMode(false);
    fetchRoomQueue(roomId);
  };
  return (
    <div
      className="right-sidebar"
      style={{
        width: isVisible ? width : 0,
        minWidth: isVisible ? minWidth : 0,
        padding: isVisible ? '10px' : 0,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div
        className="sidebar-left-edge"
        onMouseDown={() => (isResizing.current = true)}
        style={{ display: isVisible ? 'block' : 'none' }}
      />

      <div className="sidebar-section queue-header">
        <h2 className="sidebar-title">Shared Queue</h2>
        <button
          className="copy-button queue-select-button"
          onClick={selectMode ? handleDeleteSelected : toggleSelectMode}
        >
          {selectMode ? 'Delete' : 'Select'}
        </button>
      </div>

      {upcomingQueue.length === 0 ? (
        <div className="empty-queue-message">
          Empty Queue, Search or Add Links to Starting Listening
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={upcomingQueue.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {upcomingQueue.map((item) => (
              <SortableQueueItem
                key={item.id}
                id={item.id}
                item={item}
                selectMode={selectMode}
                selected={selectedIds.has(item.id)}
                onSelect={handleSelectItem}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
