import SpellRow from './SpellRow';

export default function CantripsSection({
  cantripIds, cap, spellCache, className, editMode,
  onRemove, onEditSpell, onAddCantrip, onCast,
}) {
  const ids = cantripIds || [];
  const overCap = cap != null && ids.length > cap;
  return (
    <div className="spell-zone spell-zone--cantrips">
      <div className="spell-zone__header">
        <h3 className="dnd-section-title">Cantrips</h3>
        {cap != null && (
          <span className={`spell-zone__subtitle ${overCap ? 'spell-zone__subtitle--over' : ''}`}>
            {ids.length}/{cap} known
          </span>
        )}
        {onAddCantrip && (
          <button className="dnd-add-btn spell-zone__add-btn" onClick={onAddCantrip}>+ Add Cantrip</button>
        )}
      </div>
      {ids.map((id) => {
        const spell = spellCache[id];
        if (!spell) return null;
        return (
          <div key={id} className="spell-zone__item">
            <SpellRow
              spell={spell}
              className={className}
              onRemove={onRemove}
              onEditSpell={onEditSpell}
              editMode={editMode}
              onCast={onCast}
            />
          </div>
        );
      })}
      {ids.length === 0 && <div className="spell-zone__empty">No cantrips known</div>}
    </div>
  );
}
