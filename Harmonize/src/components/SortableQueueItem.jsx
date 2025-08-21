import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableQueueItem({
  id,
  item,
  selectMode,
  selected,
  onSelect,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: selectMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: selectMode ? 'pointer' : isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="queue-card"
      {...(!selectMode && attributes)}
      {...(!selectMode && listeners)}
      onClick={selectMode ? () => onSelect(id) : undefined}
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
      {selectMode ? (
        <div className={`checkbox ${selected ? 'checked' : ''}`} />
      ) : (
        <div className="service-info">
          {item.serviceLogo && <item.serviceLogo style={{ width: 20, height: 20, marginBottom: 4 }} />}
          <div className="queued-by">{item.queuedBy}</div>
        </div>
      )}
    </div>
  );
}
