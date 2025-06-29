import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import SortableQueueItem from './SortableQueueItem.jsx';

export default function RightSidebar({ isVisible, queue, setQueue }) {
  const [width, setWidth] = useState(300);
  const minWidth = 200;
  const maxWidth = 500;
  const isResizing = useRef(false);
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const removeFromQueue = (id) => {
    setQueue((q) => q.filter((item) => item.id !== id));
    setContextMenu(null);
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

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

      <div className="sidebar-section">
        <h2 className="sidebar-title">Shared Queue</h2>
      </div>

      {queue.length === 0 ? (
        <div className="empty-queue-message">
          Empty Queue, Search or Add Links to Starting Listening
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={queue.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {queue.map((item) => (
              <SortableQueueItem
                key={item.id}
                id={item.id}
                item={item}
                onContextMenu={(e) => handleContextMenu(e, item.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="delete-button"
            onClick={() => removeFromQueue(contextMenu.id)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
