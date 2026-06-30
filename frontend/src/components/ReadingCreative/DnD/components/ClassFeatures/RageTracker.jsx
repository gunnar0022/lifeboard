import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Swords, Eye, Gauge, Zap, Footprints, Axe, HeartPulse, Flame, Mountain, Crown } from 'lucide-react';

// Barbarian rage scaling by level
function ragesForLevel(level) {
  if (level >= 20) return Infinity;
  if (level >= 17) return 6;
  if (level >= 12) return 5;
  if (level >= 6) return 4;
  if (level >= 3) return 3;
  return 2;
}

function rageDamageForLevel(level) {
  if (level >= 16) return 4;
  if (level >= 9) return 3;
  return 2;
}

// Passive / at-will Barbarian combat moves unlocked on level-up. Shown beneath
// Rage as a punchy "what can I do this turn" cheat sheet — flashy one-liners,
// not full rules text. `tag` is the quick action/keyword chip; `desc` the blurb.
const BARB_COMBAT_FEATURES = [
  { level: 2, name: 'Reckless Attack', icon: Swords, tag: 'Attack', desc: 'Go all-in: advantage on your STR attacks this turn — but enemies hit you easier until your next.' },
  { level: 2, name: 'Danger Sense', icon: Eye, tag: 'Defense', desc: 'Advantage on DEX saves against anything you can see coming.' },
  { level: 5, name: 'Extra Attack', icon: Swords, tag: 'Attack', desc: 'Swing twice every time you take the Attack action.' },
  { level: 5, name: 'Fast Movement', icon: Gauge, tag: 'Move', desc: '+10 ft speed whenever you skip heavy armor.' },
  { level: 7, name: 'Feral Instinct', icon: Zap, tag: 'Initiative', desc: 'Advantage on initiative — you\'re never caught flat-footed.' },
  { level: 7, name: 'Instinctive Pounce', icon: Footprints, tag: 'Bonus', desc: 'Rage as a bonus action and surge up to half your speed with it.' },
  { level: 9, name: 'Brutal Strike', icon: Axe, tag: 'Attack', desc: 'Drop your advantage for +1d10 damage and a punishing rider on the hit.' },
  { level: 11, name: 'Relentless Rage', icon: HeartPulse, tag: 'Survive', desc: 'Hit 0 HP while raging? A DC 10 CON save keeps you standing at 1 HP.' },
  { level: 15, name: 'Persistent Rage', icon: Flame, tag: 'Rage', desc: 'Your Rage never fizzles — it ends only when you choose to drop it.' },
  { level: 18, name: 'Indomitable Might', icon: Mountain, tag: 'Power', desc: 'Your STR checks can never roll lower than your Strength score.' },
  { level: 20, name: 'Primal Champion', icon: Crown, tag: 'Apex', desc: '+4 STR and CON (max 25). The pinnacle of primal might.' },
];

export default function RageTracker({ classFeature, editMode, onUpdate, level = 1 }) {
  const { currentUses, active, resistances, extraWhileActive } = classFeature;
  const prevLevelRef = useRef(level);

  // Auto-scale max uses and bonus damage based on level
  const maxUses = ragesForLevel(level);
  const bonusDamage = rageDamageForLevel(level);
  const isUnlimited = level >= 20;

  // When level changes, update stored values and grant extra uses if max increased
  useEffect(() => {
    const prevLevel = prevLevelRef.current;
    prevLevelRef.current = level;
    if (prevLevel === level) return;

    const prevMax = ragesForLevel(prevLevel);
    const newMax = ragesForLevel(level);
    const newDamage = rageDamageForLevel(level);
    const updates = { ...classFeature, maxUses: newMax === Infinity ? 999 : newMax, bonusDamage: newDamage };

    if (newMax > prevMax && newMax !== Infinity) {
      updates.currentUses = Math.min(currentUses + (newMax - prevMax), newMax);
    }
    onUpdate({ classFeature: updates });
  }, [level]);

  const toggleRage = () => {
    if (active) {
      onUpdate({ classFeature: { ...classFeature, active: false } });
    } else if (isUnlimited || currentUses > 0) {
      onUpdate({
        classFeature: {
          ...classFeature,
          active: true,
          currentUses: isUnlimited ? currentUses : currentUses - 1,
        },
      });
    }
  };

  const unlockedFeatures = BARB_COMBAT_FEATURES.filter(f => level >= f.level);

  return (
    <>
    <motion.div
      className={`dnd-rage ${active ? 'dnd-rage--active' : ''}`}
      animate={active ? { boxShadow: '0 0 20px rgba(180,20,20,var(--dnd-glow-opacity, 0.3))' } : { boxShadow: '0 0 0px rgba(180,20,20,0)' }}
    >
      <div className="dnd-rage__header">
        <h4 className="dnd-rage__title">RAGE</h4>
        {active ? (
          <span className="dnd-rage__status dnd-rage__status--active">ACTIVE</span>
        ) : (
          <span className="dnd-rage__uses">
            {isUnlimited ? '∞' : `${currentUses} of ${maxUses}`}
          </span>
        )}
      </div>

      <button
        className={`dnd-rage__toggle ${active ? 'dnd-rage__toggle--end' : ''}`}
        onClick={toggleRage}
        disabled={!active && !isUnlimited && currentUses === 0}
      >
        {active ? 'END RAGE' : 'RAGE'}
      </button>

      {active && (
        <motion.div
          className="dnd-rage__effects"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <p>+{bonusDamage} damage &middot; Resist {(resistances || []).join('/')}</p>
          <p>ADV on STR checks & saves</p>
          {extraWhileActive && <p className="dnd-rage__extra">{extraWhileActive}</p>}
        </motion.div>
      )}

      {editMode && (
        <div className="dnd-rage__edit">
          <div className="dnd-rage__edit-row">
            <label>Rages (Lvl {level}): {isUnlimited ? 'Unlimited' : maxUses}</label>
          </div>
          <div className="dnd-rage__edit-row">
            <label>Rage Damage (Lvl {level}): +{bonusDamage}</label>
          </div>
          <div className="dnd-rage__edit-row">
            <label>Resistances</label>
            <input className="dnd-field" value={(resistances || []).join(', ')}
              onChange={e => onUpdate({ classFeature: { ...classFeature, resistances: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
          </div>
          <div className="dnd-rage__edit-row">
            <label>Extra while active</label>
            <textarea className="dnd-field dnd-field--textarea" value={extraWhileActive || ''} rows={2}
              onChange={e => onUpdate({ classFeature: { ...classFeature, extraWhileActive: e.target.value } })} />
          </div>
        </div>
      )}
    </motion.div>

    {unlockedFeatures.length > 0 && (
      <div className="dnd-barb-feats" style={{ '--block-accent': 'var(--dnd-class-barbarian)' }}>
        <div className="dnd-barb-feats__head">
          <Swords size={14} />
          <h4 className="dnd-barb-feats__title">Combat Features</h4>
        </div>
        <div className="dnd-barb-feats__list">
          {unlockedFeatures.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.name} className="dnd-barb-feat">
                <span className="dnd-barb-feat__icon"><Icon size={16} /></span>
                <div className="dnd-barb-feat__body">
                  <div className="dnd-barb-feat__top">
                    <span className="dnd-barb-feat__name">{f.name}</span>
                    <span className="dnd-barb-feat__tag">{f.tag}</span>
                  </div>
                  <p className="dnd-barb-feat__desc">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
    </>
  );
}
