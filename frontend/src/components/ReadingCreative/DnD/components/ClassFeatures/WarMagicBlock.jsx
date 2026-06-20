import { useEffect, useRef } from 'react';
import { Shield, Zap, Sparkles } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import { powerSurgeDamage } from '../../classProgression';

/**
 * War Magic — Combat tab tracker. The only stored resource is Power Surge
 * (6th level), capped at the Intelligence modifier. Arcane Deflection, Tactical
 * Wit, Durable Magic, and Deflecting Shroud are passives/reactions, surfaced
 * here as level-gated reminders (Durable Magic lights up while concentrating).
 */
export default function WarMagicBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const intMod = abilityMod(character.abilities?.INT || 10);
  const surgeCap = Math.max(1, intMod);
  const concentrating = !!character.spellcasting?.concentratingOn;

  const hasPowerSurge = level >= 6;
  const hasDurable = level >= 10;
  const hasShroud = level >= 14;
  const surgeDmg = powerSurgeDamage(level);

  const powerSurge = cf.powerSurge || { current: 1, max: surgeCap };
  const prevCapRef = useRef(null);

  // Keep the cap synced to the Intelligence modifier; grant the new surge(s)
  // when the cap rises. Runs only when the cap changes.
  useEffect(() => {
    if (!hasPowerSurge) return;
    const prev = prevCapRef.current;
    prevCapRef.current = surgeCap;
    const ps = cf.powerSurge;
    if (!ps || ps.max !== surgeCap) {
      const grew = prev !== null && surgeCap > prev;
      const current = ps
        ? (grew ? Math.min((ps.current || 0) + (surgeCap - (ps.max || 0)), surgeCap) : Math.min(ps.current ?? surgeCap, surgeCap))
        : 1;
      onUpdate({ classFeature: { ...cf, powerSurge: { current, max: surgeCap } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surgeCap, hasPowerSurge]);

  const spendSurge = () => {
    if (powerSurge.current <= 0) return;
    onUpdate({ classFeature: { ...cf, powerSurge: { ...powerSurge, current: powerSurge.current - 1 } } });
  };
  const gainSurge = () => {
    if (powerSurge.current >= powerSurge.max) return;
    onUpdate({ classFeature: { ...cf, powerSurge: { ...powerSurge, current: powerSurge.current + 1 } } });
  };

  return (
    <div className="dnd-warmagic">
      {/* Power Surge (6th) */}
      {hasPowerSurge && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Power Surge</h4>
            <span className="dnd-warmagic__uses">{powerSurge.current}/{powerSurge.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: powerSurge.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < powerSurge.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Spend 1 (once/turn) for <strong>+{surgeDmg} force</strong> on a damaging spell.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={gainSurge} disabled={powerSurge.current >= powerSurge.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spendSurge} disabled={powerSurge.current <= 0}>Spend</button>
            </div>
          </div>
        </div>
      )}

      {/* Passive / reaction reminders */}
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Shield size={12} />
          <span><strong>Arcane Deflection</strong> — reaction: +2 AC vs an attack or +4 to a save (cantrips only until end of next turn)
          {hasShroud && <> · arcs <strong>{surgeDmg} force</strong> to 3 creatures within 60 ft</>}.</span>
        </div>
        <div className="dnd-warmagic__reminder">
          <Zap size={12} />
          <span><strong>Tactical Wit</strong> — add <strong>+{intMod >= 0 ? intMod : 0}</strong> (INT) to initiative.</span>
        </div>
        {hasDurable && (
          <div className={`dnd-warmagic__reminder ${concentrating ? 'dnd-warmagic__reminder--active' : ''}`}>
            <Sparkles size={12} />
            <span><strong>Durable Magic</strong> — +2 AC &amp; all saves while concentrating
            {concentrating ? <> · <strong>ACTIVE</strong></> : ' (not concentrating)'}.</span>
          </div>
        )}
      </div>
    </div>
  );
}
