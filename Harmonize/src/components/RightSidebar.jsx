import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import SortableQueueItem from './SortableQueueItem.jsx';

export default function RightSidebar({ isVisible, queue, setQueue, roomId }) {
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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQueue((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      if (roomId) {
        const oldIndex = queue.findIndex((i) => i.id === active.id);
        const newIndex = queue.findIndex((i) => i.id === over.id);
        try {
          await fetch(`http://localhost:3001/rooms/${roomId}/queue/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceIndex: oldIndex, destinationIndex: newIndex }),
          });
        } catch (err) {
          console.error('reorder error', err);
        }
      }
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
