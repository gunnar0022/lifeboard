import { Zap, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { classColor as resolveClassColor } from '../../dndUtils';

const USE_TYPES = [
  { id: 'per_long_rest', label: '/ long rest' },
  { id: 'per_short_rest', label: '/ short rest' },
  { id: 'prof_bonus', label: 'prof. bonus / long rest' },
  { id: 'at_will', label: 'at will' },
];
const LEVEL_LABELS = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const ord = (n) => LEVEL_LABELS[n] || `${n}th`;

/** Max uses for a granted entry given its useType. */
export function grantedMaxUses(entry, profBonus) {
  if (entry.useType === 'prof_bonus') return Math.max(1, profBonus);
  if (entry.useType === 'at_will') return 0;
  return entry.max || 1;
}

/**
 * Spells granted outside normal preparation — magic items, racial traits, feats.
 * Each has its own use pool and recharge; many can ALSO be cast with a normal
 * slot if you have one (canUseSlots), which the cast picker offers.
 */
export default function GrantedSpells({
  grantedSpells, spellCache, className, profBonus, editMode,
  onCast, onUpdate, onRemove, onAddGranted,
}) {
  const color = resolveClassColor(className);
  const entries = grantedSpells || [];
  const [openId, setOpenId] = useState(null);

  if (entries.length === 0 && !editMode) return null;

  const patch = (id, fields) => onUpdate(entries.map(e => e.id === id ? { ...e, ...fields } : e));

  const togglePip = (entry, i) => {
    const used = entry.used || 0;
    const next = i >= used ? used + 1 : used;
    patch(entry.id, { used: next });
  };

  return (
    <div className="granted-spells">
      <div className="spell-zone__header">
        <h3 className="dnd-section-title">Granted Spells</h3>
        <span className="spell-zone__subtitle">items · race · feats</span>
        {onAddGranted && (
          <button className="dnd-add-btn spell-zone__add-btn" onClick={onAddGranted}>+ Add Granted</button>
        )}
      </div>

      {entries.length === 0 && (
        <div className="spell-zone__empty">No granted spells</div>
      )}

      {entries.map((entry) => {
        const spell = spellCache[entry.spellId];
        const maxUses = grantedMaxUses(entry, profBonus);
        const used = entry.used || 0;
        const atWill = entry.useType === 'at_will';
        const isOpen = openId === entry.id;
        return (
          <div key={entry.id} className="granted-row" style={{ borderLeftColor: color }}>
            <div className="granted-row__main">
              <div className="granted-row__info">
                <span className="granted-row__source" style={{ color }}>{entry.source || 'Granted'}</span>
                <span className="granted-row__name">{spell ? spell.name : 'Unknown spell'}</span>
                <span className="granted-row__cast-at">cast as {ord(entry.castLevel ?? spell?.level ?? 0)}</span>
              </div>

              <div className="granted-row__uses">
                {atWill ? (
                  <span className="granted-row__atwill">At will</span>
                ) : (
                  <div className="spell-slots__pips">
                    {Array.from({ length: maxUses }, (_, i) => {
                      const available = i >= used;
                      return (
                        <button key={i}
                          className={`spell-slots__pip ${available ? 'spell-slots__pip--available' : 'spell-slots__pip--expended'}`}
                          style={available ? { background: color, borderColor: color } : {}}
                          onClick={() => togglePip(entry, i)}
                          title={available ? 'Use' : 'Restore'}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {onCast && !editMode && spell && (
                <button className="spell-row__cast-btn" style={{ borderColor: color, color }}
                  onClick={() => onCast(spell, entry)} title="Cast">
                  <Zap size={12} /> Cast
                </button>
              )}

              <button className="granted-row__expand" onClick={() => setOpenId(isOpen ? null : entry.id)}>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {editMode && (
                <button className="spell-slots__adj spell-slots__adj--remove" onClick={() => onRemove(entry.id)}>
                  <X size={11} />
                </button>
              )}
            </div>

            {isOpen && (
              <div className="granted-row__detail">
                {spell?.description && <p className="spell-row__desc">{spell.description}</p>}
                {editMode && (
                  <div className="granted-row__config">
                    <label>Source
                      <input className="dnd-field" value={entry.source || ''} placeholder="e.g. Drow Magic"
                        onChange={e => patch(entry.id, { source: e.target.value })} />
                    </label>
                    <label>Uses
                      <select className="dnd-field" value={entry.useType}
                        onChange={e => patch(entry.id, { useType: e.target.value, used: 0 })}>
                        {USE_TYPES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                      </select>
                    </label>
                    {(entry.useType === 'per_long_rest' || entry.useType === 'per_short_rest') && (
                      <label>Count
                        <input type="number" className="dnd-field dnd-field--sm" min={1} value={entry.max || 1}
                          onChange={e => patch(entry.id, { max: parseInt(e.target.value) || 1 })} />
                      </label>
                    )}
                    <label>Cast at
                      <select className="dnd-field" value={entry.castLevel ?? (spell?.level ?? 0)}
                        onChange={e => patch(entry.id, { castLevel: parseInt(e.target.value) })}>
                        {LEVEL_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
                      </select>
                    </label>
                    <label className="granted-row__check">
                      <input type="checkbox" checked={!!entry.canUseSlots}
                        onChange={e => patch(entry.id, { canUseSlots: e.target.checked })} />
                      Castable with normal slots
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
