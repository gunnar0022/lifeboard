import { useState } from 'react';

const RUNE_LIST = [
  {
    name: 'Cloud Rune',
    minLevel: 3,
    passive: 'ADV on Sleight of Hand and Deception checks.',
    invoke: 'Reaction: when you or a creature within 30ft is hit by an attack, choose a different creature within 30ft (other than the attacker) to become the target instead, using the same roll. Works regardless of range.',
  },
  {
    name: 'Fire Rune',
    minLevel: 3,
    passive: 'Proficiency bonus doubled for ability checks using tool proficiency.',
    invoke: 'On weapon hit: extra 2d6 fire damage + target must succeed STR save or be restrained for 1 min (2d6 fire at start of each turn, repeat save at end of turn).',
  },
  {
    name: 'Frost Rune',
    minLevel: 3,
    passive: 'ADV on Animal Handling and Intimidation checks.',
    invoke: 'Bonus action: +2 to all STR and CON ability checks and saving throws for 10 minutes.',
  },
  {
    name: 'Stone Rune',
    minLevel: 3,
    passive: 'ADV on Insight checks. Darkvision 120ft.',
    invoke: 'Reaction: when a creature ends its turn within 30ft, force WIS save. On fail: charmed for 1 min (speed 0, incapacitated, dreamy stupor). Repeat save at end of each turn.',
  },
  {
    name: 'Hill Rune',
    minLevel: 7,
    passive: 'ADV on saves against poison. Resistance to poison damage.',
    invoke: 'Bonus action: resistance to bludgeoning, piercing, and slashing damage for 1 minute.',
  },
  {
    name: 'Storm Rune',
    minLevel: 7,
    passive: 'ADV on Arcana checks. Can\'t be surprised while not incapacitated.',
    invoke: 'Bonus action: prophetic state for 1 min. Use reaction to give ADV or DISADV to any attack roll, save, or ability check made by a creature within 60ft.',
  },
];

// Rune Knight: number of runes known by level
function maxRunesKnown(level) {
  if (level >= 15) return 5;
  if (level >= 7) return 4;
  return 2; // 3rd level
}

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
          <span className="dnd-runeKnight__rune-count">{knownRunes.length}/{maxRunesKnown(level)} runes</span>
          {knownRunes.length < maxRunesKnown(level) && (
            <button className="dnd-runeKnight__add-rune" onClick={() => setShowRunePicker(!showRunePicker)}>
              + Rune
            </button>
          )}
        </div>

        {showRunePicker && (
          <div className="dnd-runeKnight__rune-picker">
            {RUNE_LIST
              .filter(r => !knownRunes.includes(r.name) && r.minLevel <= level)
              .map(rune => (
                <button key={rune.name} className="dnd-runeKnight__rune-option" onClick={() => addRune(rune.name)} title={rune.passive}>
                  {rune.name}
                  {rune.minLevel > 3 && <span className="dnd-runeKnight__rune-lvl">Lvl {rune.minLevel}+</span>}
                </button>
              ))}
            {RUNE_LIST.filter(r => !knownRunes.includes(r.name) && r.minLevel > level).length > 0 && (
              <div className="dnd-runeKnight__locked-label">
                Locked ({RUNE_LIST.filter(r => r.minLevel > level).map(r => r.name).join(', ')} — requires level {RUNE_LIST.find(r => r.minLevel > level)?.minLevel}+)
              </div>
            )}
          </div>
        )}

        {knownRunes.length === 0 && (
          <p className="dnd-runeKnight__empty">No runes inscribed. Click + Rune to add.</p>
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
              <div className="dnd-runeKnight__rune-details">
                <div className="dnd-runeKnight__rune-passive">
                  <strong>Passive:</strong> {rune?.passive || ''}
                </div>
                <div className="dnd-runeKnight__rune-invoke-desc">
                  <strong>Invoke:</strong> {rune?.invoke || ''}
                </div>
              </div>
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
