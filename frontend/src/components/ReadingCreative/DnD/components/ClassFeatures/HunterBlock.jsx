import { Crosshair, Swords, Shield, ShieldCheck, Wind, Target, Ghost } from 'lucide-react';
import { HUNTER_TIERS } from '../../rules/subclasses/hunter';

/**
 * Hunter (Hunter's Conclave) — Combat tab. The subclass is four tier choices
 * (3/7/11/15) with no per-rest pools, so this block presents each reached tier
 * as a compact signature card — its own accent and icon, the chosen option
 * featured with a usage chip and combat note. Unchosen tiers nudge to the
 * Features tab. The picks themselves are made there.
 */
const ICONS = {
  'Colossus Slayer': Crosshair,
  'Giant Killer': Swords,
  'Horde Breaker': Target,
  'Escape the Horde': Wind,
  'Multiattack Defense': Shield,
  'Steel Will': ShieldCheck,
  'Volley': Target,
  'Whirlwind Attack': Wind,
  'Evasion': Wind,
  'Stand Against the Tide': Swords,
  'Uncanny Dodge': Shield,
};

const KIND_LABEL = { perTurn: '1 / turn', reaction: 'Reaction', action: 'Action', passive: 'Passive' };

// Each tier gets its own flavor accent + fallback icon.
const TIER_STYLE = {
  'hunter-prey': { accent: 'var(--dnd-class-barbarian)', icon: Crosshair },
  'hunter-defensive': { accent: 'var(--dnd-class-fighter)', icon: Shield },
  'hunter-multiattack': { accent: 'var(--dnd-class-ranger)', icon: Target },
  'hunter-superior': { accent: 'var(--dnd-class-rogue)', icon: Ghost },
};

export default function HunterBlock({ character }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const choices = cf.hunterChoices || {};
  const reached = HUNTER_TIERS.filter(t => t.level <= level);

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-ranger)' }}>
      {reached.map(tier => {
        const style = TIER_STYLE[tier.id] || {};
        const opt = tier.options.find(o => o.name === choices[tier.id]) || null;
        const Icon = opt ? (ICONS[opt.name] || style.icon) : style.icon;
        return (
          <div key={tier.id}
            className={`dnd-sig dnd-sig--mini ${opt ? '' : 'dnd-sig--empty'}`}
            style={{ '--block-accent': style.accent }}>
            <div className="dnd-sig__token">{Icon ? <Icon size={18} /> : null}</div>
            <div className="dnd-sig__body">
              <span className="dnd-sig__eyebrow">{tier.name} · Lvl {tier.level}</span>
              <span className="dnd-sig__title">{opt ? opt.name : 'Choose an option'}</span>
              {opt ? (
                <>
                  <div className="dnd-sig__chips">
                    <span className="dnd-sig__chip dnd-sig__chip--on">{KIND_LABEL[opt.kind]}</span>
                  </div>
                  <span className="dnd-sig__desc">{opt.combatNote}</span>
                </>
              ) : (
                <span className="dnd-sig__desc">Pick this tier on the Features tab.</span>
              )}
            </div>
          </div>
        );
      })}

      <p className="dnd-warmagic__note dnd-hunter__foot">
        Each tier is a permanent choice — set or change it on the Features tab.
      </p>
    </div>
  );
}
