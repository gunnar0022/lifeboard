import { Shield, Eye, Sparkles, HeartPulse, Users } from 'lucide-react';

/**
 * Circle of the Shepherd — Combat tab. Spirit Totem is the engine: pick Bear, Hawk,
 * or Unicorn and the chosen aura's effect shows its live numbers (Bear temp HP and
 * Unicorn healing both scale with druid level). It's a once-per-short-rest summon.
 * Guardian Spirit's regen and Faithful Summons (long rest) ride below. Accent: druid green.
 */
const SPIRITS = {
  Bear: { icon: Shield, effect: (lvl) => `Creatures of your choice in the aura gain ${5 + lvl} temp HP; you & allies have advantage on Strength checks and saves.` },
  Hawk: { icon: Eye, effect: () => `Reaction: grant advantage to an attack roll against a target in the aura; you & allies have advantage on Perception.` },
  Unicorn: { icon: Sparkles, effect: (lvl) => `Advantage to detect creatures in the aura; when you heal with a slot, each chosen creature in the aura also regains ${lvl} HP.` },
};

export default function ShepherdBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const spirit = cf.spiritType || 'Bear';
  const totemUsed = cf.spiritTotemUsed || false;
  const faithfulUsed = cf.faithfulSummonsUsed || false;
  const guardianHeal = Math.floor(level / 2);

  const setSpirit = (s) => onUpdate({ classFeature: { ...cf, spiritType: s } });
  const Effect = SPIRITS[spirit];

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-druid)' }}>
      {/* Spirit Totem */}
      <div className={`dnd-warmagic__section ${totemUsed ? 'dnd-archfey__spent' : ''}`}>
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Spirit Totem</h4>
          <span className="dnd-warmagic__uses">{totemUsed ? 'spent' : '1 / short'}</span>
        </div>
        <div className="dnd-druid__lands">
          {Object.keys(SPIRITS).map(s => (
            <button key={s} className={`dnd-druid__land ${spirit === s ? 'dnd-druid__land--active' : ''}`} onClick={() => setSpirit(s)}>{s}</button>
          ))}
        </div>
        <p className="dnd-warmagic__note">Bonus action: a 30-ft aura for 1 min (move 60 ft as a bonus action). {Effect.effect(level)}</p>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Recharge on a short or long rest.</span>
          <div className="dnd-warmagic__btns">
            {totemUsed && <button className="dnd-warmagic__btn" onClick={() => onUpdate({ classFeature: { ...cf, spiritTotemUsed: false } })}>Reset</button>}
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, spiritTotemUsed: true } })} disabled={totemUsed}>{totemUsed ? 'Spent' : 'Summon'}</button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <HeartPulse size={12} />
            <span><strong>Mighty Summoner</strong> — beasts/fey you conjure gain <strong>+2 HP per Hit Die</strong> and magical natural weapons.</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Guardian Spirit</strong> — your summoned beasts/fey ending their turn in the aura regain <strong>{guardianHeal} HP</strong>.</span>
          </div>
        )}
        {level >= 14 && (
          <div className={`dnd-warmagic__reminder ${faithfulUsed ? 'dnd-archfey__spent' : 'dnd-warmagic__reminder--active'}`}>
            <Users size={12} />
            <span><strong>Faithful Summons</strong> — dropping to 0 HP / incapacitated auto-casts Conjure Animals (four CR-2 beasts, 1 hr). {faithfulUsed ? '(spent)' : '1 / long rest.'}</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-echo__inline-btn" onClick={() => onUpdate({ classFeature: { ...cf, faithfulSummonsUsed: !faithfulUsed } })}>{faithfulUsed ? 'Reset' : 'Use'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
