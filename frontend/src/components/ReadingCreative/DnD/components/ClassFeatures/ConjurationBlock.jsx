import { Box, Waypoints, Focus, Users, ScrollText } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * School of Conjuration — Combat tab. Minor Conjuration is a live "what did I
 * pull from thin air?" slot — name the dim-glowing object and dismiss it when it
 * pops. Benign Transportation is a blink that recharges on a long rest *or* by
 * casting any conjuration spell. Focused Conjuration lights up while you hold
 * concentration on a conjuration; Durable Summons rides along as a reminder.
 */
export default function ConjurationBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const intMod = abilityMod(character.abilities?.INT || 10);
  const concentrating = !!character.spellcasting?.concentratingOn;

  const conj = cf.minorConjuration || { active: false, label: '' };
  const blinkUsed = !!cf.benignTransportUsed;

  const setConj = (next) => onUpdate({ classFeature: { ...cf, minorConjuration: { ...conj, ...next } } });
  const conjure = () => setConj({ active: true });
  const vanish = () => setConj({ active: false });
  const setBlink = (used) => onUpdate({ classFeature: { ...cf, benignTransportUsed: used } });

  const hasBlink = level >= 6;
  const hasFocused = level >= 10;
  const hasDurable = level >= 14;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-druid)' }}>
      {/* Minor Conjuration */}
      <div className={`dnd-conjure ${conj.active ? 'dnd-conjure--active' : ''}`}>
        <div className="dnd-conjure__icon"><Box size={18} /></div>
        <div className="dnd-conjure__body">
          <h4 className="dnd-conjure__title">Minor Conjuration</h4>
          {conj.active ? (
            <input
              className="dnd-conjure__input"
              placeholder="conjured object…"
              value={conj.label}
              onChange={(e) => setConj({ label: e.target.value })}
            />
          ) : (
            <span className="dnd-warmagic__note">≤3 ft, ≤10 lb, dim light 5 ft. Lasts 1 hr / until recast / takes or deals damage.</span>
          )}
        </div>
        {conj.active
          ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={vanish}>Dismiss</button>
          : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={conjure}>Conjure</button>}
      </div>

      {/* Benign Transportation */}
      {hasBlink && (
        <div className={`dnd-warmagic__section ${blinkUsed ? '' : 'dnd-blink--ready'}`}>
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Waypoints size={13} /> Benign Transportation</h4>
            <span className="dnd-warmagic__uses">{blinkUsed ? 'spent' : 'ready'}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Action: teleport 30 ft, or swap with a willing Small/Medium creature. Recharges on a long rest <em>or</em> when you cast a conjuration spell (1st+).</span>
            <div className="dnd-warmagic__btns">
              {blinkUsed
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => setBlink(false)} title="Recharged by a conjuration spell">Recharge</button>
                : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => setBlink(true)}>Blink</button>}
            </div>
          </div>
        </div>
      )}

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        {hasFocused && (
          <div className={`dnd-warmagic__reminder ${concentrating ? 'dnd-warmagic__reminder--active' : ''}`}>
            <Focus size={12} />
            <span><strong>Focused Conjuration</strong> — concentration on a conjuration spell can't be broken by taking damage
            {concentrating ? <> · <strong>CONCENTRATING</strong></> : ' (not concentrating)'}.</span>
          </div>
        )}
        {hasDurable && (
          <div className="dnd-warmagic__reminder">
            <Users size={12} />
            <span><strong>Durable Summons</strong> — any creature you summon or create with a conjuration spell has <strong>30 temporary HP</strong>.</span>
          </div>
        )}
        <div className="dnd-warmagic__reminder">
          <ScrollText size={12} />
          <span><strong>Conjuration Savant</strong> — copying conjuration spells into your spellbook costs half the gold and time.</span>
        </div>
      </div>
    </div>
  );
}
