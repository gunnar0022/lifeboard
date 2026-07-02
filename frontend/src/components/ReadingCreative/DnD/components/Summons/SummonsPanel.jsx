import { useState } from 'react';
import { Sparkles, PawPrint } from 'lucide-react';
import SummonInstanceCard from './SummonInstanceCard';
import SummonPicker from './SummonPicker';

/**
 * Summons sub-tab of the Combat tab. Owns the character.summons array (live
 * battlefield creatures) and the character-wide concentration link. Each creature
 * renders its own independently-tracked SummonInstanceCard.
 */
export default function SummonsPanel({ character, onUpdate }) {
  const [picking, setPicking] = useState(false);
  const summons = character.summons || [];
  const concentration = character.concentration || null;

  const addInstances = (list) => onUpdate({ summons: [...summons, ...list] });

  const updateInstance = (id, updated) =>
    onUpdate({ summons: summons.map(s => (s.id === id ? updated : s)) });

  const removeInstance = (id) => {
    const holdsConc = concentration?.kind === 'summon' && concentration.refId === id;
    const upd = { summons: summons.filter(s => s.id !== id) };
    if (holdsConc) upd.concentration = null;
    onUpdate(upd);
  };

  // Concentration is a single character-wide slot (see StatusBar). Claiming it for
  // a summon auto-drops any prior spell/summon concentration.
  const claimConcentration = (instance) => {
    const upd = {
      concentration: {
        name: instance.name || instance.block?.name || 'Summon',
        kind: 'summon',
        refId: instance.id,
      },
    };
    if (character.spellcasting) upd.spellcasting = { concentratingOn: null };
    onUpdate(upd);
  };

  const dropConcentration = () => {
    const upd = { concentration: null };
    if (character.spellcasting) upd.spellcasting = { concentratingOn: null };
    onUpdate(upd);
  };

  return (
    <div className="dnd-summons">
      <div className="dnd-summons__head">
        <h3 className="dnd-section-title"><PawPrint size={15} /> Summons & Companions</h3>
        <button className="dnd-summons__add" onClick={() => setPicking(true)}>
          <Sparkles size={14} /> Summon
        </button>
      </div>

      {summons.length === 0 ? (
        <div className="dnd-summons__empty">
          <Sparkles size={28} />
          <p>No creatures summoned.</p>
          <span>Cast a conjuration, then summon it here to track its HP, attacks, conditions, and allegiance — or build a custom companion your DM approved.</span>
        </div>
      ) : (
        <div className="dnd-summons__list">
          {summons.map(inst => (
            <SummonInstanceCard
              key={inst.id}
              instance={inst}
              onChange={(updated) => updateInstance(inst.id, updated)}
              onRemove={() => removeInstance(inst.id)}
              holdsConcentration={concentration?.kind === 'summon' && concentration.refId === inst.id}
              onClaimConcentration={claimConcentration}
              onDropConcentration={dropConcentration}
            />
          ))}
        </div>
      )}

      {picking && <SummonPicker onSpawn={addInstances} onClose={() => setPicking(false)} />}
    </div>
  );
}
