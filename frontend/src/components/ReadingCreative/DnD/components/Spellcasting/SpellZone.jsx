import { useRef, useState } from 'react';
import SpellRow from './SpellRow';

const LEVEL_LABELS = { 0: 'Cantrips', 1: '1st Level', 2: '2nd Level', 3: '3rd Level', 4: '4th Level', 5: '5th Level', 6: '6th Level', 7: '7th Level', 8: '8th Level', 9: '9th Level' };

export default function SpellZone({ title, subtitle, spellIds, spellOrder, spellCache, concentratingOn, className, editMode, onReorder, onConcentrate, onRemove, onEditSpell, onMoveTo, onReceiveDrop, moveLabel, onAddSpell }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragRef = useRef(null);

  // Use spellOrder for display order, falling back to spellIds
  const orderedIds = (spellOrder || spellIds || []).filter(id => spellIds.includes(id));
  // Add any IDs not in order array
  const remaining = spellIds.filter(id => !orderedIds.includes(id));
  const displayIds = [...orderedIds, ...remaining];

  // Group spells by level
  const grouped = {};
  displayIds.forEach((id, idx) => {
    const spell = spellCache[id];
    if (!spell) return;
    const lvl = spell.level ?? 0;
    if (!grouped[lvl]) grouped[lvl] = [];
    grouped[lvl].push({ id, spell, idx });
  });

  const sortedLevels = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const handleDragStart = (e, idx) => {
    dragRef.current = idx;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(displayIds[idx]));
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

  // Handle drops from other zones — receives a spell INTO this zone
  const handleZoneDrop = (e) => {
    e.preventDefault();
    const spellId = parseInt(e.dataTransfer.getData('text/plain'));
    if (!spellId || displayIds.includes(spellId)) return;
    // Spell is from another zone — receive it into this zone
    if (onReceiveDrop) onReceiveDrop(spellId);
    setDragOverIdx(null);
  };

  const handleZoneDragOver = (e) => {
    e.preventDefault();
  };

  let flatIdx = 0;

  return (
    <div className="spell-zone" onDrop={handleZoneDrop} onDragOver={handleZoneDragOver}>
      <div className="spell-zone__header">
        <h3 className="dnd-section-title">{title}</h3>
        {subtitle && <span className="spell-zone__subtitle">{subtitle}</span>}
        {onAddSpell && (
          <button className="dnd-add-btn spell-zone__add-btn" onClick={onAddSpell}>+ Add Spell</button>
        )}
      </div>

      {sortedLevels.map(lvl => {
        const items = grouped[lvl];
        return (
          <div key={lvl} className="spell-zone__level-group">
            <div className="spell-zone__level-heading">
              <span>{LEVEL_LABELS[lvl] || `Level ${lvl}`}</span>
            </div>
            {items.map(({ id, spell, idx }) => {
              const currentFlat = flatIdx++;
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
          </div>
        );
      })}

      {displayIds.length === 0 && (
        <div className="spell-zone__empty">No spells {title.toLowerCase()}</div>
      )}
    </div>
  );
}
