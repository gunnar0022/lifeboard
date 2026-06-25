import { useEffect, useRef } from 'react';
import { Users, HandHeart, ShieldCheck, Wand2 } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Peace Domain — Combat tab. The PB-scaled Emboldening Bond pool (a d4 buff aura)
 * and Channel Divinity: Balm of Peace (a mobile heal) headline the cleric-styled
 * block, with Protective Bond / Potent Spellcasting / Expansive Bond as reminders.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function PeaceDomainBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const pb = proficiencyBonus(level);
  const prev = useRef(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = pb;
    if (cf.emboldeningBond?.max !== pb) {
      const stored = cf.emboldeningBond?.current;
      const next = stored == null ? pb
        : (p != null && pb > p ? Math.min(stored + (pb - p), pb) : Math.min(stored, pb));
      onUpdate({ classFeature: { ...cf, emboldeningBond: { max: pb, current: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb]);

  const bond = cf.emboldeningBond || { current: pb, max: pb };
  const stepBond = (d) =>
    onUpdate({ classFeature: { ...cf, emboldeningBond: { ...bond, current: Math.max(0, Math.min(bond.max, bond.current + d)) } } });

  const options = [{
    name: 'Balm of Peace',
    icon: <HandHeart size={13} />,
    desc: <>Action: move up to your speed without provoking opportunity attacks; heal each creature you pass within 5 ft for <strong>2d6 + {wisMod}</strong> (min 1), once each.</>,
  }];

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Users size={13} /> Emboldening Bond</h4>
          <span className="dnd-warmagic__uses">{bond.current}/{bond.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: bond.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < bond.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">
            Action: bond up to {pb} willing creatures within 30 ft for 10 min — each adds 1d4 to an attack/check/save (once per turn) while near another. Long rest.
          </span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={() => stepBond(1)} disabled={bond.current >= bond.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepBond(-1)} disabled={bond.current <= 0}>Use</button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 6 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldCheck size={12} />
            <span><strong>Protective Bond</strong> — a bonded creature can use its reaction to teleport to an ally about to take damage and take it instead{level >= 17 ? ' (with resistance, within 60 ft)' : ''}.</span>
          </div>
        )}
        {level >= 8 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Wand2 size={12} />
            <span><strong>Potent Spellcasting</strong> — add your WIS modifier (+{Math.max(0, wisMod)}) to the damage of any cleric cantrip.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder">
            <Users size={12} />
            <span><strong>Expansive Bond</strong> — your bonds now function within 60 ft.</span>
          </div>
        )}
      </div>
    </div>
  );
}
