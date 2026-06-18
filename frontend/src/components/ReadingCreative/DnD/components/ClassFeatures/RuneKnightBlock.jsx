import { useEffect, useRef } from 'react';
import { proficiencyBonus } from '../../dndUtils';
import { RUNE_LIST, maxRuneInvocations, giantsMightDie, giantsMightSize } from '../../classProgression';

/**
 * Rune Knight — Combat tab tracker only. Full feature descriptions and the
 * rune *selection* (build choice) live in the Features tab; this block keeps
 * the active resources you manage in a fight: Giant's Might uses, per-rune
 * invocation counters, and Runic Shield uses. Uses scale with proficiency bonus.
 */
export default function RuneKnightBlock({ character, editMode, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const prevPbRef = useRef(null);

  const giantsMight = cf.giantsMight || { maxUses: pb, currentUses: pb, active: false };
  const runicShield = cf.runicShield || { maxUses: pb, currentUses: pb };
  const knownRunes = cf.knownRunes || [];
  const runeInvocations = cf.runeInvocations || {};
  const maxInvocationsPerRune = maxRuneInvocations(level);
  const hasRunicShield = level >= 7;

  // Keep Giant's Might / Runic Shield max equal to proficiency bonus; grant the
  // new use(s) when PB increases on level-up. Runs only when PB changes.
  useEffect(() => {
    const prev = prevPbRef.current;
    prevPbRef.current = pb;
    const gm = cf.giantsMight;
    const rs = cf.runicShield;
    const updates = {};
    const grew = prev !== null && pb > prev;

    if (!gm || gm.maxUses !== pb) {
      updates.giantsMight = {
        active: gm?.active || false,
        maxUses: pb,
        currentUses: gm ? (grew ? Math.min((gm.currentUses || 0) + (pb - (gm.maxUses || 0)), pb) : Math.min(gm.currentUses ?? pb, pb)) : pb,
      };
    }
    if (!rs || rs.maxUses !== pb) {
      updates.runicShield = {
        maxUses: pb,
        currentUses: rs ? (grew ? Math.min((rs.currentUses || 0) + (pb - (rs.maxUses || 0)), pb) : Math.min(rs.currentUses ?? pb, pb)) : pb,
      };
    }
    if (Object.keys(updates).length) onUpdate({ classFeature: { ...cf, ...updates } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb]);

  const toggleGiantsMight = () => {
    const next = { ...giantsMight, active: !giantsMight.active };
    if (!giantsMight.active && giantsMight.currentUses > 0) {
      next.currentUses = giantsMight.currentUses - 1;
    }
    onUpdate({ classFeature: { ...cf, giantsMight: next } });
  };

  const toggleRuneInvocation = (runeName) => {
    const current = runeInvocations[runeName] || { usedCount: 0 };
    const newCount = current.usedCount >= maxInvocationsPerRune ? 0 : current.usedCount + 1;
    onUpdate({
      classFeature: { ...cf, runeInvocations: { ...runeInvocations, [runeName]: { usedCount: newCount } } },
    });
  };

  const useRunicShield = () => {
    if (runicShield.currentUses <= 0) return;
    onUpdate({ classFeature: { ...cf, runicShield: { ...runicShield, currentUses: runicShield.currentUses - 1 } } });
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
            {giantsMight.active ? "END GIANT'S MIGHT" : "GIANT'S MIGHT"}
          </button>
          <span className="dnd-runeKnight__uses">{giantsMight.currentUses}/{giantsMight.maxUses}</span>
        </div>
        {giantsMight.active && (
          <div className="dnd-runeKnight__gm-effects">
            <span>Become {giantsMightSize(level)}</span>
            <span>+1{giantsMightDie(level)} dmg (1/turn)</span>
            <span>ADV on STR checks &amp; saves</span>
          </div>
        )}
      </div>

      {/* Rune invocations (selection lives in the Features tab) */}
      <div className="dnd-runeKnight__section">
        <div className="dnd-runeKnight__rune-header">
          <h4 className="dnd-runeKnight__subtitle">Runes</h4>
          {maxInvocationsPerRune > 1 && <span className="dnd-runeKnight__rune-count">2 invocations each</span>}
        </div>

        {knownRunes.length === 0 && (
          <p className="dnd-runeKnight__empty">No runes inscribed — choose runes in the Features tab.</p>
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
              </div>
              {rune?.invoke && <p className="dnd-runeKnight__rune-invoke-label">{rune.invoke}</p>}
            </div>
          );
        })}
      </div>

      {/* Runic Shield (7th level) */}
      {hasRunicShield && (
        <div className="dnd-runeKnight__section">
          <div className="dnd-runeKnight__rune-header">
            <h4 className="dnd-runeKnight__subtitle">Runic Shield</h4>
            <span className="dnd-runeKnight__uses">{runicShield.currentUses}/{runicShield.maxUses}</span>
          </div>
          <div className="dnd-runeKnight__uses-row">
            <span className="dnd-runeKnight__rune-invoke-label">Reaction: force an attacker within 60ft to reroll.</span>
            <button className="dnd-runeKnight__shield-use" onClick={useRunicShield} disabled={runicShield.currentUses <= 0}>Use</button>
          </div>
        </div>
      )}
    </div>
  );
}
