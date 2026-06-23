import { useEffect, useRef } from 'react';
import { Ghost, Swords, HeartPulse, Eye, Users } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Echo Knight — Combat tab. The echo itself is a toggled presence (AC 14 + PB, 1 HP)
 * rendered as a little manifest card. Two Constitution-sized pools drive the rest:
 * Unleash Incarnation (extra echo attack) and, from 15th, Reclaim Potential (temp HP
 * when an echo dies) — both refill on a long rest and grow with your CON modifier.
 * Shadow Martyr is a once-per-short-rest reaction. Legion of One doubles the echo at 18th.
 */
export default function EchoKnightBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const conMod = abilityMod(character.abilities?.CON || 10);
  const cap = Math.max(1, conMod);
  const echoAC = 14 + pb;
  const prevCapRef = useRef(null);

  const echoActive = cf.echoActive || false;
  const hasReclaim = level >= 15;
  const hasMartyr = level >= 10;
  const legion = level >= 18;
  const unleash = cf.unleashIncarnation || { max: cap, current: cap };
  const reclaim = cf.reclaimPotential || { max: cap, current: cap };
  const martyrUsed = cf.shadowMartyrUsed || false;

  // Keep the CON-sized pools in sync; grant new use(s) when the modifier rises.
  useEffect(() => {
    const prev = prevCapRef.current;
    prevCapRef.current = cap;
    const grew = prev !== null && cap > prev;
    const updates = {};
    const sync = (key) => {
      const r = cf[key];
      if (!r || r.max !== cap) {
        updates[key] = {
          max: cap,
          current: r ? (grew ? Math.min((r.current || 0) + (cap - (r.max || 0)), cap) : Math.min(r.current ?? cap, cap)) : cap,
        };
      }
    };
    sync('unleashIncarnation');
    if (level >= 15) sync('reclaimPotential');
    if (Object.keys(updates).length) onUpdate({ classFeature: { ...cf, ...updates } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap, level]);

  const toggleEcho = () => onUpdate({ classFeature: { ...cf, echoActive: !echoActive } });
  const spend = (key, r) => { if (r.current > 0) onUpdate({ classFeature: { ...cf, [key]: { ...r, current: r.current - 1 } } }); };
  const restore = (key, r) => { if (r.current < r.max) onUpdate({ classFeature: { ...cf, [key]: { ...r, current: r.current + 1 } } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-fighter)' }}>
      {/* Manifest Echo */}
      <div className={`dnd-echo ${echoActive ? 'dnd-echo--active' : ''}`}>
        <div className="dnd-echo__head">
          <span className="dnd-echo__title"><Ghost size={14} /> {legion ? 'Echoes' : 'Echo'}{echoActive ? ' — manifested' : ''}</span>
          <button className="dnd-echo__toggle" onClick={toggleEcho}>{echoActive ? 'Dismiss' : 'Manifest'}</button>
        </div>
        <div className="dnd-echo__stats">
          <span className="dnd-echo__stat">AC <strong>{echoAC}</strong></span>
          <span className="dnd-echo__stat">HP <strong>1</strong></span>
          <span className="dnd-echo__stat">Manifest 15 ft · move 30 ft</span>
        </div>
        <p className="dnd-echo__note">
          Bonus action: swap places (15 ft of movement). Attack from your space or the echo's; make opportunity attacks from it.
          {legion && <> <strong>Legion of One:</strong> up to two echoes at once.</>}
        </p>
      </div>

      {/* Unleash Incarnation */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Swords size={13} /> Unleash Incarnation</h4>
          <span className="dnd-warmagic__uses">{unleash.current}/{unleash.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: unleash.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < unleash.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">On your Attack action, one extra melee attack from the echo. Recharge on a long rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={() => restore('unleashIncarnation', unleash)} disabled={unleash.current >= unleash.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spend('unleashIncarnation', unleash)} disabled={unleash.current <= 0}>Use</button>
          </div>
        </div>
      </div>

      {/* Reclaim Potential */}
      {hasReclaim && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><HeartPulse size={13} /> Reclaim Potential</h4>
            <span className="dnd-warmagic__uses">{reclaim.current}/{reclaim.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: reclaim.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < reclaim.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">When an echo dies to damage, gain <strong>2d6+{conMod}</strong> temp HP (if you have none). Recharge on a long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => restore('reclaimPotential', reclaim)} disabled={reclaim.current >= reclaim.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spend('reclaimPotential', reclaim)} disabled={reclaim.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      {/* Shadow Martyr + reminders */}
      <div className="dnd-warmagic__reminders">
        {hasMartyr && (
          <div className={`dnd-warmagic__reminder ${martyrUsed ? 'dnd-archfey__spent' : 'dnd-warmagic__reminder--active'}`}>
            <Ghost size={12} />
            <span><strong>Shadow Martyr</strong> — reaction: the echo takes an attack aimed at another creature. {martyrUsed ? '(spent — short rest)' : '1 / short rest.'}</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-echo__inline-btn" onClick={() => onUpdate({ classFeature: { ...cf, shadowMartyrUsed: !martyrUsed } })}>{martyrUsed ? 'Reset' : 'Use'}</button>
          </div>
        )}
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Eye size={12} />
            <span><strong>Echo Avatar</strong> — action: see/hear through the echo up to 10 min (blinded &amp; deafened); range extends to 1,000 ft.</span>
          </div>
        )}
        {legion && (
          <div className="dnd-warmagic__reminder">
            <Users size={12} />
            <span><strong>Legion of One</strong> — initiative with no Unleash Incarnation left regains one use.</span>
          </div>
        )}
      </div>
    </div>
  );
}
