import { useState } from 'react';
import { Shield, ShieldPlus, Users, Sparkles, ScrollText } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * School of Abjuration — Combat tab. The centerpiece is the Arcane Ward: a
 * shimmering HP pool (2 × wizard level + INT) that soaks damage in your stead.
 * Weave it by casting an abjuration spell, bleed it down as it absorbs hits,
 * and top it back up (2 × spell level) by casting more abjurations. Projected
 * Ward, Improved Abjuration, and Spell Resistance ride along as reminders.
 */
export default function AbjurationBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const intMod = abilityMod(character.abilities?.INT || 10);
  const maxHp = Math.max(1, level * 2 + intMod);

  const ward = cf.arcaneWard || { hp: 0, created: false };
  const hp = Math.min(ward.hp || 0, maxHp);
  const pct = Math.round((hp / maxHp) * 100);

  const [dmg, setDmg] = useState('');

  const setWard = (next) => onUpdate({ classFeature: { ...cf, arcaneWard: { ...ward, ...next } } });

  const weave = () => setWard({ hp: maxHp, created: true });
  const dissolve = () => setWard({ hp: 0, created: false });
  const absorb = () => {
    const n = parseInt(dmg, 10);
    if (!n || n < 0) return;
    setWard({ hp: Math.max(0, hp - n) });
    setDmg('');
  };
  const recharge = (lvl) => setWard({ hp: Math.min(maxHp, hp + lvl * 2) });
  const step = (d) => setWard({ hp: Math.max(0, Math.min(maxHp, hp + d)) });

  const hasProjected = level >= 6;
  const hasImproved = level >= 10;
  const hasResistance = level >= 14;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-wizard)' }}>
      {/* Arcane Ward centerpiece */}
      <div className={`dnd-aegis ${ward.created ? 'dnd-aegis--up' : ''} ${ward.created && hp === 0 ? 'dnd-aegis--broken' : ''}`}>
        <div className="dnd-aegis__head">
          <h4 className="dnd-aegis__title"><Shield size={14} /> Arcane Ward</h4>
          <span className="dnd-aegis__hp">{ward.created ? `${hp} / ${maxHp}` : `0 / ${maxHp}`}</span>
        </div>

        <div className="dnd-aegis__bar" title={`${hp} of ${maxHp} ward HP`}>
          <div className="dnd-aegis__fill" style={{ width: `${ward.created ? pct : 0}%` }} />
          <span className="dnd-aegis__bar-label">
            {!ward.created ? 'Unwoven' : hp === 0 ? 'Shattered — magic lingers' : 'Shielding'}
          </span>
        </div>

        {!ward.created ? (
          <div className="dnd-aegis__row">
            <span className="dnd-warmagic__note">Cast an abjuration spell (1st+) to weave the ward. One weave per long rest.</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={weave}>
              <ShieldPlus size={12} /> Weave
            </button>
          </div>
        ) : (
          <>
            <div className="dnd-aegis__controls">
              <div className="dnd-aegis__absorb">
                <input
                  type="number" min="0" className="dnd-aegis__input" placeholder="dmg"
                  value={dmg} onChange={(e) => setDmg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && absorb()}
                />
                <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={absorb} disabled={hp <= 0}>Absorb</button>
                <button className="dnd-warmagic__btn" onClick={() => step(-1)} disabled={hp <= 0}>−1</button>
                <button className="dnd-warmagic__btn" onClick={() => step(1)} disabled={hp >= maxHp}>+1</button>
              </div>
            </div>
            <div className="dnd-aegis__recharge">
              <span className="dnd-aegis__recharge-label">Recharge (abj. slot):</span>
              {[1, 2, 3, 4, 5, 6].map(l => (
                <button key={l} className="dnd-aegis__chip" onClick={() => recharge(l)} disabled={hp >= maxHp}
                  title={`+${l * 2} ward HP`}>
                  L{l}<small>+{l * 2}</small>
                </button>
              ))}
              <button className="dnd-warmagic__btn dnd-aegis__dissolve" onClick={dissolve} title="Remove the ward">Dissolve</button>
            </div>
          </>
        )}
      </div>

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        {hasProjected && (
          <div className="dnd-warmagic__reminder">
            <Users size={12} />
            <span><strong>Projected Ward</strong> — reaction: an ally within 30 ft takes damage → your ward absorbs it instead (overflow hits them).</span>
          </div>
        )}
        {hasImproved && (
          <div className="dnd-warmagic__reminder">
            <ScrollText size={12} />
            <span><strong>Improved Abjuration</strong> — add your proficiency bonus to ability checks made as part of casting abjuration spells (Counterspell, Dispel Magic).</span>
          </div>
        )}
        {hasResistance && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Sparkles size={12} />
            <span><strong>Spell Resistance</strong> — advantage on saving throws against spells, and resistance to the damage of spells.</span>
          </div>
        )}
      </div>
    </div>
  );
}
