import { useEffect, useRef, useState } from 'react';
import { FlaskConical, Dices, Beaker, Sparkles, HeartPulse, ShieldPlus, Plus } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import { ELIXIR_EFFECTS, elixirsPerRest } from '../../rules/shared/elixirs';

/**
 * Alchemist — Combat tab. The centerpiece is the Alchemy Bench: a rack of
 * experimental-elixir flasks you brew after a long rest (rolled) or craft on the
 * fly with a spell slot (chosen), then drink to trigger their effect. Below it
 * sit the Restorative Reagents reserve (free Lesser Restoration), the
 * once-per-rest Chemical Mastery heals, and the passive reminders.
 * State: classFeature.elixirs / lesserRestoration / chemMastery.
 */
const ACCENT = 'var(--dnd-class-artificer)';
const newId = () => `elx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const rollEffect = () => ELIXIR_EFFECTS[Math.floor(Math.random() * ELIXIR_EFFECTS.length)].name;
const effData = (name) => ELIXIR_EFFECTS.find(e => e.name === name);

export default function AlchemistBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const intMod = abilityMod(character.abilities?.INT || 10);
  const baseCount = elixirsPerRest(level);
  const lrMax = Math.max(1, intMod);

  const elixirs = cf.elixirs || [];
  const lr = cf.lesserRestoration || { current: 0, max: lrMax };
  const chem = cf.chemMastery || { greaterRestoration: false, heal: false };

  const [picking, setPicking] = useState(false);
  const prev = useRef(null);

  // Reconcile the Lesser Restoration reserve to INT.
  useEffect(() => {
    const p = prev.current;
    prev.current = lrMax;
    if (level >= 9 && cf.lesserRestoration?.max !== lrMax) {
      const stored = cf.lesserRestoration?.current;
      const next = stored == null ? lrMax
        : (p != null && lrMax > p ? Math.min(stored + (lrMax - p), lrMax) : Math.min(stored, lrMax));
      onUpdate({ classFeature: { ...cf, lesserRestoration: { max: lrMax, current: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lrMax, level]);

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  // ── Elixir bench ──
  const brewRest = () =>
    patch({ elixirs: Array.from({ length: baseCount }, () => ({ id: newId(), effect: rollEffect() })) });
  const addChosen = (name) => {
    patch({ elixirs: [...elixirs, { id: newId(), effect: name }] });
    setPicking(false);
  };
  const reroll = (id) =>
    patch({ elixirs: elixirs.map(e => e.id === id ? { ...e, effect: rollEffect() } : e) });
  const drink = (id) => patch({ elixirs: elixirs.filter(e => e.id !== id) });

  // ── Lesser Restoration ──
  const stepLr = (d) =>
    patch({ lesserRestoration: { ...lr, current: Math.max(0, Math.min(lr.max, lr.current + d)) } });

  return (
    <div className="dnd-warmagic dnd-alch" style={{ '--block-accent': ACCENT }}>
      {/* ── Alchemy Bench ── */}
      <div className="dnd-artificer__bench">
        <div className="dnd-artificer__bench-head">
          <h4 className="dnd-warmagic__subtitle"><Beaker size={14} /> Alchemy Bench</h4>
          <span className="dnd-warmagic__uses">{elixirs.length} in hand · {baseCount}/rest</span>
        </div>

        <div className="dnd-alch__brew">
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={brewRest}>
            <Dices size={12} /> Brew {baseCount} (long rest)
          </button>
          <button className="dnd-artificer__add dnd-alch__add" onClick={() => setPicking(!picking)}>
            <Plus size={12} /> Craft (spell slot)
          </button>
        </div>

        {picking && (
          <div className="dnd-feature-choice__picker">
            {ELIXIR_EFFECTS.map(e => (
              <button key={e.name} className="dnd-feature-choice__pick" onClick={() => addChosen(e.name)} title={e.desc}>
                {e.name}
              </button>
            ))}
          </div>
        )}

        {elixirs.length === 0 ? (
          <p className="dnd-artificer__hint">No elixirs in hand — brew a batch after a long rest, or craft one with a spell slot.</p>
        ) : (
          <div className="dnd-alch__flasks">
            {elixirs.map(e => {
              const d = effData(e.effect);
              return (
                <div key={e.id} className="dnd-alch__flask">
                  <div className="dnd-alch__flask-icon"><FlaskConical size={16} /></div>
                  <div className="dnd-alch__flask-body">
                    <span className="dnd-alch__flask-name">{e.effect}</span>
                    <span className="dnd-alch__flask-short">{d?.short}</span>
                  </div>
                  <div className="dnd-alch__flask-btns">
                    <button className="dnd-warmagic__btn" onClick={() => reroll(e.id)} title="Re-roll effect"><Dices size={11} /></button>
                    <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => drink(e.id)}>Drink</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {level >= 9 && (
          <p className="dnd-artificer__hint dnd-alch__temp">
            <ShieldPlus size={11} /> On drink, the creature also gains <strong>2d6 + {intMod}</strong> temp HP (Restorative Reagents).
          </p>
        )}
      </div>

      {/* ── Restorative Reagents: Lesser Restoration reserve ── */}
      {level >= 9 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><HeartPulse size={13} /> Lesser Restoration</h4>
            <span className="dnd-warmagic__uses">{lr.current}/{lr.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: lr.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < lr.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Cast Lesser Restoration free with alchemist's supplies. Long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepLr(1)} disabled={lr.current >= lr.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepLr(-1)} disabled={lr.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chemical Mastery: once-per-rest big heals ── */}
      {level >= 15 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Chemical Mastery</h4>
          </div>
          <div className="dnd-alch__mastery">
            {[
              { key: 'greaterRestoration', label: 'Greater Restoration' },
              { key: 'heal', label: 'Heal' },
            ].map(s => (
              <button
                key={s.key}
                className={`dnd-alch__spell ${chem[s.key] ? 'dnd-alch__spell--used' : ''}`}
                onClick={() => patch({ chemMastery: { ...chem, [s.key]: !chem[s.key] } })}
              >
                {chem[s.key] ? `${s.label} — used` : `Cast ${s.label}`}
              </button>
            ))}
          </div>
          <span className="dnd-warmagic__note">Each free (no slot/components) once per long rest, via alchemist's supplies.</span>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        {level >= 5 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Sparkles size={12} />
            <span><strong>Alchemical Savant</strong> — spells cast through alchemist's supplies add +{Math.max(1, intMod)} (INT) to one healing or acid/fire/necrotic/poison roll.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <ShieldPlus size={12} />
            <span><strong>Chemical Mastery</strong> — resistance to acid &amp; poison damage; immune to the poisoned condition.</span>
          </div>
        )}
      </div>
    </div>
  );
}
