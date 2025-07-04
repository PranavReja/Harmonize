import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableQueueItem({ id, item, deleteMode, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: deleteMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: deleteMode ? 'pointer' : isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="queue-card"
      {...(!deleteMode && attributes)}
      {...(!deleteMode && listeners)}
      onClick={deleteMode ? () => onDelete(id) : undefined}
    >
      {item.albumCover ? (
        <img src={item.albumCover} alt="album cover" className="album-cover" />
      ) : (
        <div className="album-cover-placeholder" />
      )}
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
  );
}
