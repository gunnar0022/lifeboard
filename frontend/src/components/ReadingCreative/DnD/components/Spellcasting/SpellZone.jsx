import SpellRow from './SpellRow';

const LEVEL_LABELS = { 0: 'Cantrips', 1: '1st Level', 2: '2nd Level', 3: '3rd Level', 4: '4th Level', 5: '5th Level', 6: '6th Level', 7: '7th Level', 8: '8th Level', 9: '9th Level' };

/**
 * A spell zone (Prepared / Known / Cantrips). Drag is gone — spells move
 * between zones with a single button. `moveDisabled` blocks the move when the
 * destination (Prepared) is at its level-conscious cap.
 */
export default function SpellZone({
  title, subtitle, spellIds, spellCache, concentratingOn, className, editMode,
  onConcentrate, onRemove, onEditSpell, onCast, onMove, moveLabel, moveDisabled,
  alwaysPrepared, onToggleAlwaysPrepared, onAddSpell,
}) {
  // Group spells by level.
  const grouped = {};
  (spellIds || []).forEach((id) => {
    const spell = spellCache[id];
    if (!spell) return;
    const lvl = spell.level ?? 0;
    (grouped[lvl] = grouped[lvl] || []).push({ id, spell });
  });
  const sortedLevels = Object.keys(grouped).map(Number).sort((a, b) => a - b);
  const alwaysSet = new Set(alwaysPrepared || []);

  return (
    <div className="spell-zone">
      <div className="spell-zone__header">
        <h3 className="dnd-section-title">{title}</h3>
        {subtitle && <span className="spell-zone__subtitle">{subtitle}</span>}
        {onAddSpell && (
          <button className="dnd-add-btn spell-zone__add-btn" onClick={onAddSpell}>+ Add Spell</button>
        )}
      </div>

      {sortedLevels.map((lvl) => (
        <div key={lvl} className="spell-zone__level-group">
          <div className="spell-zone__level-heading"><span>{LEVEL_LABELS[lvl] || `Level ${lvl}`}</span></div>
          {grouped[lvl].map(({ id, spell }) => (
            <div key={id} className="spell-zone__item">
              <SpellRow
                spell={spell}
                isConcentrating={concentratingOn === id}
                className={className}
                onConcentrate={onConcentrate}
                onRemove={onRemove}
                onEditSpell={onEditSpell}
                editMode={editMode}
                onCast={onCast}
                onMove={onMove}
                moveLabel={moveLabel}
                moveDisabled={typeof moveDisabled === 'function' ? moveDisabled(id) : moveDisabled}
                isAlwaysPrepared={alwaysSet.has(id)}
                onToggleAlwaysPrepared={onToggleAlwaysPrepared}
              />
            </div>
          ))}
        </div>
      ))}

      {(!spellIds || spellIds.length === 0) && (
        <div className="spell-zone__empty">No spells {title.toLowerCase()}</div>
      )}
    </div>
  );
}
