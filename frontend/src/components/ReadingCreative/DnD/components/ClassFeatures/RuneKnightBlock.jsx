import { useState } from 'react';

const RUNE_LIST = [
  { name: 'Cloud Rune', desc: 'When hit, redirect attack to another creature within 30ft. Also: ADV on Deception and Sleight of Hand.' },
  { name: 'Fire Rune', desc: 'On hit, extra 2d6 fire + restrained for 1 min (STR save). Also: double proficiency on tool checks.' },
  { name: 'Frost Rune', desc: 'Bonus action: +2 to STR/CON checks and saves for 10 min. Also: ADV on Animal Handling and Intimidation.' },
  { name: 'Stone Rune', desc: 'Reaction: charm creature within 30ft, incapacitated + speed 0 for 1 min (WIS save). Also: ADV on Insight, darkvision 120ft.' },
  { name: 'Hill Rune', desc: 'Bonus action: resistance to bludgeoning/slashing/piercing for 1 min. Also: ADV on saves vs. poison, resistance to poison.' },
  { name: 'Storm Rune', desc: 'Bonus action: enter prophetic state for 1 min — reaction to impose ADV/DISADV on any roll within 60ft. Also: ADV on Arcana, can\'t be surprised.' },
];

export default function RuneKnightBlock({ character, editMode, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;

  // Giant's Might
  const giantsMight = cf.giantsMight || { maxUses: 2, currentUses: 2, active: false };
  const gmDamageDie = level >= 18 ? 'd10' : level >= 10 ? 'd8' : 'd6';
  const gmSize = level >= 18 ? 'Huge' : 'Large';

  // Runes
  const knownRunes = cf.knownRunes || [];
  const runeInvocations = cf.runeInvocations || {}; // {runeName: {used: bool}}
  const maxInvocationsPerRune = level >= 15 ? 2 : 1;

  // Runic Shield (7th level)
  const runicShield = cf.runicShield || { maxUses: 0, currentUses: 0 };
  const hasRunicShield = level >= 7;

  const [showRunePicker, setShowRunePicker] = useState(false);

  const toggleGiantsMight = () => {
    const updated = { ...cf, giantsMight: { ...giantsMight, active: !giantsMight.active } };
    if (!giantsMight.active && giantsMight.currentUses > 0) {
      updated.giantsMight.currentUses = giantsMight.currentUses - 1;
    }
    onUpdate({ classFeature: updated });
  };

  const toggleRuneInvocation = (runeName) => {
    const current = runeInvocations[runeName] || { usedCount: 0 };
    const newCount = current.usedCount >= maxInvocationsPerRune ? 0 : current.usedCount + 1;
    onUpdate({
      classFeature: {
        ...cf,
        runeInvocations: {
          ...runeInvocations,
          [runeName]: { usedCount: newCount },
        },
      },
    });
  };

  const addRune = (runeName) => {
    if (knownRunes.includes(runeName)) return;
    onUpdate({
      classFeature: {
        ...cf,
        knownRunes: [...knownRunes, runeName],
      },
    });
    setShowRunePicker(false);
  };

  const removeRune = (runeName) => {
    const newInvocations = { ...runeInvocations };
    delete newInvocations[runeName];
    onUpdate({
      classFeature: {
        ...cf,
        knownRunes: knownRunes.filter(r => r !== runeName),
        runeInvocations: newInvocations,
      },
    });
  };

  return (
    <div className="dnd-runeKnight">
      {/* Giant's Might */}
      <div className="dnd-runeKnight__section">
        <div className="dnd-runeKnight__gm-header">
          <button
            className={`dnd-runeKnight__gm-toggle ${giantsMight.active ? 'dnd-runeKnight__gm-toggle--active' : ''}`}
            onClick={toggleGiantsMight}
            disabled={!giantsMight.active && giantsMight.currentUses <= 0}
          >
            {giantsMight.active ? 'END GIANT\'S MIGHT' : 'GIANT\'S MIGHT'}
          </button>
          <span className="dnd-runeKnight__uses">
            {giantsMight.currentUses}/{giantsMight.maxUses}
          </span>
        </div>
        {giantsMight.active && (
          <div className="dnd-runeKnight__gm-effects">
            <span>Become {gmSize}</span>
            <span>+1{gmDamageDie} damage (once/turn)</span>
            <span>ADV on STR checks & saves</span>
          </div>
        )}
        {editMode && (
          <div className="dnd-runeKnight__edit-row">
            <label>Max uses: <input type="number" className="dnd-field dnd-field--sm"
              value={giantsMight.maxUses} min={1}
              onChange={e => onUpdate({ classFeature: { ...cf, giantsMight: { ...giantsMight, maxUses: parseInt(e.target.value) || 1 } } })} />
            </label>
          </div>
        )}
      </div>

      {/* Runes */}
      <div className="dnd-runeKnight__section">
        <div className="dnd-runeKnight__rune-header">
          <h4 className="dnd-runeKnight__subtitle">Rune Carver</h4>
          {editMode && (
            <button className="dnd-runeKnight__add-rune" onClick={() => setShowRunePicker(!showRunePicker)}>
              + Rune
            </button>
          )}
        </div>

        {showRunePicker && (
          <div className="dnd-runeKnight__rune-picker">
            {RUNE_LIST.filter(r => !knownRunes.includes(r.name)).map(rune => (
              <button key={rune.name} className="dnd-runeKnight__rune-option" onClick={() => addRune(rune.name)}>
                {rune.name}
              </button>
            ))}
          </div>
        )}

        {knownRunes.length === 0 && (
          <p className="dnd-runeKnight__empty">No runes inscribed. {editMode ? 'Click + Rune to add.' : ''}</p>
        )}

        {knownRunes.map(runeName => {
          const rune = RUNE_LIST.find(r => r.name === runeName);
          const invocation = runeInvocations[runeName] || { usedCount: 0 };
          const allUsed = invocation.usedCount >= maxInvocationsPerRune;

          return (
            <div key={runeName} className={`dnd-runeKnight__rune ${allUsed ? 'dnd-runeKnight__rune--spent' : ''}`}>
              <div className="dnd-runeKnight__rune-row">
                <span className="dnd-runeKnight__rune-name">{runeName}</span>
                <button
                  className={`dnd-runeKnight__invoke ${allUsed ? 'dnd-runeKnight__invoke--spent' : ''}`}
                  onClick={() => toggleRuneInvocation(runeName)}
                  title={allUsed ? 'Reset invocation' : 'Invoke rune'}
                >
                  {invocation.usedCount}/{maxInvocationsPerRune}
                </button>
                {editMode && (
                  <button className="dnd-runeKnight__remove-rune" onClick={() => removeRune(runeName)}>X</button>
                )}
              </div>
              <p className="dnd-runeKnight__rune-desc">{rune?.desc || ''}</p>
            </div>
          );
        })}
      </div>

      {/* Runic Shield (7th level) */}
      {hasRunicShield && (
        <div className="dnd-runeKnight__section">
          <h4 className="dnd-runeKnight__subtitle">Runic Shield</h4>
          <p className="dnd-runeKnight__desc">Reaction: force reroll on attack against creature within 60ft.</p>
          <div className="dnd-runeKnight__uses-row">
            <span>Uses: {runicShield.currentUses}/{runicShield.maxUses || (level >= 7 ? Math.max(1, Math.floor(level / 7)) : 0)}</span>
            <button onClick={() => {
              const max = runicShield.maxUses || Math.max(1, Math.floor(level / 7));
              onUpdate({ classFeature: { ...cf, runicShield: { ...runicShield, currentUses: Math.max(0, runicShield.currentUses - 1) } } });
            }}>Use</button>
          </div>
        </div>
      )}
    </div>
  );
}
