import { Swords, Shield, Scissors, Wind, Repeat } from 'lucide-react';
import { bardicInspirationDie } from '../../classProgression';

/**
 * College of Swords — Combat tab. Pick a Fighting Style (persisted), then the three
 * Blade Flourishes ride the base Bardic Inspiration die. From 14th (Master's Flourish)
 * a flourish can spend a free d6 instead of an inspiration die, shown inline. Extra
 * Attack surfaces at 6th. Accent: duelist's steel-red.
 */
const STYLES = {
  Dueling: '+2 damage with a one-handed melee weapon when wielding no other weapon.',
  'Two-Weapon Fighting': 'Add your ability modifier to the damage of the off-hand attack.',
};

const FLOURISHES = [
  { name: 'Defensive', icon: Shield, text: 'Extra damage = die; add the roll to your AC until your next turn.' },
  { name: 'Slashing', icon: Scissors, text: 'Extra damage = die to the target and one other creature within 5 ft of you.' },
  { name: 'Mobile', icon: Wind, text: 'Extra damage = die; push the target 5 ft + the roll, then react to move up to your speed.' },
];

export default function SwordsBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const die = bardicInspirationDie(level);
  const masters = level >= 14;
  const style = cf.swordsFightingStyle || null;

  const setStyle = (s) => onUpdate({ classFeature: { ...cf, swordsFightingStyle: cf.swordsFightingStyle === s ? null : s } });

  return (
    <div className="dnd-bardsub" style={{ '--accent': '#c0584f' }}>
      {/* Fighting Style */}
      <div className="dnd-bardsub__card">
        <div className="dnd-bardsub__head">
          <span className="dnd-bardsub__title"><Swords size={13} /> Fighting Style</span>
        </div>
        <div className="dnd-bardsub__seg">
          {Object.keys(STYLES).map(s => (
            <button key={s} className={`dnd-bardsub__seg-btn ${style === s ? 'dnd-bardsub__seg-btn--active' : ''}`} onClick={() => setStyle(s)}>{s}</button>
          ))}
        </div>
        {style && <p className="dnd-bardsub__note">{STYLES[style]}</p>}
      </div>

      {/* Blade Flourish */}
      <div className="dnd-bardsub__card dnd-bardsub__card--hero">
        <div className="dnd-bardsub__head">
          <span className="dnd-bardsub__title"><Wind size={13} /> Blade Flourish</span>
          <span className="dnd-bardsub__die">{masters ? `${die} / d6` : die}</span>
        </div>
        <p className="dnd-bardsub__note">
          On the Attack action: <strong>+10 ft speed</strong>, and on a hit use <strong>one</strong> flourish (per turn), spending a Bardic Inspiration die{masters && <> — or a free <strong>d6</strong> (Master's Flourish)</>}.
        </p>
        <div className="dnd-bardsub__flourishes-list">
          {FLOURISHES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.name} className="dnd-bardsub__flourish-row">
                <Icon size={12} />
                <span><strong>{f.name}.</strong> {f.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dnd-bardsub__reminders">
        {level >= 6 && (
          <div className="dnd-bardsub__reminder">
            <Repeat size={12} />
            <span><strong>Extra Attack</strong> — attack twice whenever you take the Attack action.</span>
          </div>
        )}
      </div>
    </div>
  );
}
