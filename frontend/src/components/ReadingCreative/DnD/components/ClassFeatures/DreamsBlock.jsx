import { useEffect, useRef } from 'react';
import { Sparkles, Moon, Footprints, Sparkle } from 'lucide-react';
import { abilityMod } from '../../dndUtils';

/**
 * Circle of Dreams — Combat tab. Balm of the Summer Court is a big d6 pool (one die
 * per druid level) you spend a handful at a time to heal; it's tracked as a counter
 * rather than pips. Hidden Paths is a Wisdom-sized teleport pool, and Walker in
 * Dreams a once-per-long-rest ritual. Both pools refill on a long rest. Accent: fey green.
 */
export default function DreamsBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const pathsCap = Math.max(1, wisMod);
  const perUse = Math.max(1, Math.floor(level / 2));
  const prevRef = useRef({ balm: null, paths: null });

  const balm = cf.balmDice || { max: level, current: level };
  const paths = cf.hiddenPaths || { max: pathsCap, current: pathsCap };
  const walkerUsed = cf.walkerUsed || false;
  const hasPaths = level >= 10;
  const hasWalker = level >= 14;

  // Balm pool tracks druid level; Hidden Paths tracks the Wisdom modifier.
  useEffect(() => {
    const updates = {};
    const sync = (key, cap, pk) => {
      const prev = prevRef.current[pk];
      prevRef.current[pk] = cap;
      const r = cf[key];
      if (!r || r.max !== cap) {
        const grew = prev !== null && cap > prev;
        updates[key] = {
          max: cap,
          current: r ? (grew ? Math.min((r.current || 0) + (cap - (r.max || 0)), cap) : Math.min(r.current ?? cap, cap)) : cap,
        };
      }
    };
    sync('balmDice', level, 'balm');
    if (hasPaths) sync('hiddenPaths', pathsCap, 'paths');
    if (Object.keys(updates).length) onUpdate({ classFeature: { ...cf, ...updates } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, pathsCap, hasPaths]);

  const stepBalm = (d) => {
    const next = Math.max(0, Math.min(balm.max, balm.current + d));
    if (next !== balm.current) onUpdate({ classFeature: { ...cf, balmDice: { ...balm, current: next } } });
  };
  const stepPaths = (d) => {
    const next = Math.max(0, Math.min(paths.max, paths.current + d));
    if (next !== paths.current) onUpdate({ classFeature: { ...cf, hiddenPaths: { ...paths, current: next } } });
  };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-druid)' }}>
      {/* Balm of the Summer Court */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Balm of the Summer Court</h4>
          <span className="dnd-warmagic__uses">{balm.current}/{balm.max} d6</span>
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Bonus action: spend up to <strong>{perUse}</strong> dice to heal an ally within 120 ft (roll &amp; sum) + <strong>1 temp HP</strong> per die. Refills on a long rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={() => stepBalm(1)} disabled={balm.current >= balm.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepBalm(-1)} disabled={balm.current <= 0}>Spend</button>
          </div>
        </div>
      </div>

      {/* Hidden Paths */}
      {hasPaths && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Footprints size={13} /> Hidden Paths</h4>
            <span className="dnd-warmagic__uses">{paths.current}/{paths.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: paths.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < paths.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Bonus action: teleport 60 ft · or action: teleport a touched ally 30 ft. Refills on a long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepPaths(1)} disabled={paths.current >= paths.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepPaths(-1)} disabled={paths.current <= 0}>Blink</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Moon size={12} />
          <span><strong>Hearth of Moonlight and Shadow</strong> — on a rest, a 30-ft sphere grants you &amp; allies <strong>+5</strong> Stealth &amp; Perception and hides firelight.</span>
        </div>
        {hasWalker && (
          <div className={`dnd-warmagic__reminder ${walkerUsed ? 'dnd-archfey__spent' : 'dnd-warmagic__reminder--active'}`}>
            <Sparkle size={12} />
            <span><strong>Walker in Dreams</strong> — after a short rest, cast Dream, Scrying, or Teleportation Circle free. {walkerUsed ? '(spent)' : '1 / long rest.'}</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-echo__inline-btn" onClick={() => onUpdate({ classFeature: { ...cf, walkerUsed: !walkerUsed } })}>{walkerUsed ? 'Reset' : 'Use'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
