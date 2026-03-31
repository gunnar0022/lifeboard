import { useRef, useState } from 'react';
import SpellRow from './SpellRow';

export default function CantripsSection({ cantripIds, spellOrder, spellCache, className, editMode, onReorder, onRemove, onEditSpell, onAddCantrip, concentratingOn, onConcentrate }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragRef = useRef(null);

  const orderedIds = (spellOrder || cantripIds || []).filter(id => cantripIds.includes(id));
  const remaining = cantripIds.filter(id => !orderedIds.includes(id));
  const displayIds = [...orderedIds, ...remaining];

  const handleDragStart = (e, idx) => {
    dragRef.current = idx;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    const sourceIdx = dragRef.current;
    if (sourceIdx === null || sourceIdx === targetIdx) return;
    const newOrder = [...displayIds];
    const [moved] = newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    onReorder(newOrder);
    setDragIdx(null);
    setDragOverIdx(null);
    dragRef.current = null;
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
    dragRef.current = null;
  };

  return (
    <div className="spell-zone spell-zone--cantrips">
      <div className="spell-zone__header">
        <h3 className="dnd-section-title">Cantrips</h3>
        {onAddCantrip && (
          <button className="dnd-add-btn spell-zone__add-btn" onClick={onAddCantrip}>+ Add Cantrip</button>
        )}
      </div>
      {displayIds.map((id, idx) => {
        const spell = spellCache[id];
        if (!spell) return null;
        return (
          <div
            key={id}
            draggable
            onDragStart={e => handleDragStart(e, idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDrop={e => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            className={`spell-zone__item ${dragOverIdx === idx ? 'spell-zone__item--drag-over' : ''} ${dragIdx === idx ? 'spell-zone__item--dragging' : ''}`}
          >
            <SpellRow
              spell={spell}
              isConcentrating={concentratingOn === id}
              className={className}
              onConcentrate={onConcentrate}
              onRemove={onRemove}
              onEditSpell={onEditSpell}
              editMode={editMode}
              dragHandleProps={{}}
            />
          </div>
        );
      })}
      {displayIds.length === 0 && (
        <div className="spell-zone__empty">No cantrips known</div>
      )}
    </div>
  );
}
