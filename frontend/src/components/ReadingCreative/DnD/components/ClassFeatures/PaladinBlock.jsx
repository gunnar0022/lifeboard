import { useEffect, useRef } from 'react';
import { HeartHandshake, Eye, Sun, Sparkles, Shield, Swords } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import { layOnHandsPool } from '../../classProgression';

/** Harness Divine Power uses per long rest by paladin level. */
function paladinHarnessUses(level) {
  if (level >= 15) return 3;
  if (level >= 7) return 2;
  if (level >= 3) return 1;
  return 0;
}

/**
 * Paladin — Combat tab. Lay on Hands headlines as a glowing healing font (its
 * pool = 5 × level), with Divine Smite featured as a signature strike. Below
 * sit the use-based resources — Divine Sense, Channel Divinity (oath options
 * live in the subclass block), Harness Divine Power, Cleansing Touch — and the
 * Aura of Protection reminder. Pools reconcile to level/CHA, granting the delta.
 */
export default function PaladinBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const chaMod = abilityMod(character.abilities?.CHA || 10);

  const lohMax = layOnHandsPool(level);
  const senseMax = Math.max(1, 1 + chaMod);
  const cleanseMax = Math.max(1, chaMod);
  const harnessMax = paladinHarnessUses(level);
  const prev = useRef(null);

  // Reconcile every pool's max when level / CHA changes, granting the delta on
  // growth rather than refilling.
  useEffect(() => {
    const p = prev.current;
    prev.current = { lohMax, senseMax, cleanseMax, harnessMax };
    const grow = (stored, max, oldMax) => {
      if (stored == null) return max;
      return oldMax != null && max > oldMax ? Math.min(stored + (max - oldMax), max) : Math.min(stored, max);
    };
    const patch = {};
    if ((cf.layOnHands?.maxPool) !== lohMax) {
      patch.layOnHands = { maxPool: lohMax, currentPool: grow(cf.layOnHands?.currentPool, lohMax, p?.lohMax) };
    }
    if ((cf.divineSense?.max) !== senseMax) {
      patch.divineSense = { max: senseMax, current: grow(cf.divineSense?.current, senseMax, p?.senseMax) };
    }
    if ((cf.cleansingTouch?.max) !== cleanseMax) {
      patch.cleansingTouch = { max: cleanseMax, current: grow(cf.cleansingTouch?.current, cleanseMax, p?.cleanseMax) };
    }
    if ((cf.harnessDivinePower?.max) !== harnessMax) {
      patch.harnessDivinePower = { max: harnessMax, current: grow(cf.harnessDivinePower?.current, harnessMax, p?.harnessMax) };
    }
    if (!cf.channelDivinity) patch.channelDivinity = { current: 1, max: 1 };
    if (Object.keys(patch).length) onUpdate({ classFeature: { ...cf, ...patch } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lohMax, senseMax, cleanseMax, harnessMax]);

  const loh = cf.layOnHands || { maxPool: lohMax, currentPool: lohMax };
  const sense = cf.divineSense || { current: senseMax, max: senseMax };
  const cd = cf.channelDivinity || { current: 1, max: 1 };
  const hdp = cf.harnessDivinePower || { current: harnessMax, max: harnessMax };
  const cleanse = cf.cleansingTouch || { current: cleanseMax, max: cleanseMax };

  const patchCf = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });
  const stepLoh = (d) => patchCf({ layOnHands: { ...loh, currentPool: Math.max(0, Math.min(loh.maxPool, loh.currentPool + d)) } });
  const useUse = (key, obj) => { if (obj.current > 0) patchCf({ [key]: { ...obj, current: obj.current - 1 } }); };
  const addUse = (key, obj) => { if (obj.current < obj.max) patchCf({ [key]: { ...obj, current: obj.current + 1 } }); };

  const lohPct = loh.maxPool > 0 ? (loh.currentPool / loh.maxPool) * 100 : 0;

  const pips = (obj) => (
    <div className="dnd-warmagic__pips">
      {Array.from({ length: obj.max }, (_, i) => (
        <span key={i} className={`dnd-warmagic__pip ${i < obj.current ? 'dnd-warmagic__pip--full' : ''}`} />
      ))}
    </div>
  );

  const useRow = (key, obj, label, icon, note) => (
    <div className="dnd-warmagic__section">
      <div className="dnd-warmagic__head">
        <h4 className="dnd-warmagic__subtitle">{icon} {label}</h4>
        <span className="dnd-warmagic__uses">{obj.current}/{obj.max}</span>
      </div>
      {pips(obj)}
      <div className="dnd-warmagic__row">
        <span className="dnd-warmagic__note">{note}</span>
        <div className="dnd-warmagic__btns">
          <button className="dnd-warmagic__btn" onClick={() => addUse(key, obj)} disabled={obj.current >= obj.max}>+</button>
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => useUse(key, obj)} disabled={obj.current <= 0}>Use</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-paladin)' }}>
      {/* Lay on Hands — glowing healing font */}
      <div className={`dnd-paladin__font ${loh.currentPool > 0 ? 'dnd-paladin__font--charged' : ''}`}>
        <div className="dnd-paladin__font-token"><HeartHandshake size={22} /></div>
        <div className="dnd-paladin__font-body">
          <div className="dnd-paladin__font-head">
            <span className="dnd-paladin__font-title">Lay on Hands</span>
            <span className="dnd-paladin__font-num">{loh.currentPool}<span className="dnd-paladin__font-max">/{loh.maxPool} HP</span></span>
          </div>
          <div className="dnd-paladin__font-bar">
            <div className="dnd-paladin__font-fill" style={{ width: `${Math.min(100, lohPct)}%` }} />
          </div>
          <div className="dnd-paladin__font-foot">
            <span className="dnd-warmagic__note">Heal from the pool · spend 5 to cure a disease or poison · long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepLoh(-5)} disabled={loh.currentPool <= 0}>−5</button>
              <button className="dnd-warmagic__btn" onClick={() => stepLoh(-1)} disabled={loh.currentPool <= 0}>−1</button>
              <button className="dnd-warmagic__btn" onClick={() => stepLoh(1)} disabled={loh.currentPool >= loh.maxPool}>+1</button>
              <button className="dnd-warmagic__btn" onClick={() => stepLoh(5)} disabled={loh.currentPool >= loh.maxPool}>+5</button>
            </div>
          </div>
        </div>
      </div>

      {/* Divine Smite — signature strike */}
      <div className="dnd-sig dnd-sig--smite">
        <div className="dnd-sig__token">{level >= 11 ? '+1d8' : '2d8'}</div>
        <div className="dnd-sig__body">
          <span className="dnd-sig__title"><Swords size={13} /> Divine Smite</span>
          <span className="dnd-sig__desc">
            Expend a spell slot on a melee hit: <strong>2d8 radiant</strong>, +1d8 per slot level above 1st (max 5d8), and +1d8 vs. undead or fiends.
            {level >= 11 && <> <strong>Improved Divine Smite</strong>: every melee hit deals an extra <strong>1d8 radiant</strong>.</>}
          </span>
        </div>
      </div>

      {useRow('divineSense', sense, 'Divine Sense', <Eye size={13} />, 'Action: detect celestials/fiends/undead within 60 ft. Long rest.')}

      {level >= 3 && useRow('channelDivinity', cd, 'Channel Divinity', <Sun size={13} />, 'Power your oath options (Combat tab). Short or long rest.')}

      {level >= 3 && harnessMax > 0 && useRow('harnessDivinePower', hdp, 'Harness Divine Power', <Sparkles size={13} />, 'Optional: spend a Channel Divinity use to regain a spell slot. Long rest.')}

      {level >= 14 && useRow('cleansingTouch', cleanse, 'Cleansing Touch', <Sparkles size={13} />, 'Action: end one spell on yourself or a willing creature. Long rest.')}

      <div className="dnd-warmagic__reminders">
        {level >= 6 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Sun size={12} />
            <span><strong>Aura of Protection</strong> — +{Math.max(1, chaMod)} (CHA) to saves for you and allies within {level >= 18 ? 30 : 10} ft{level >= 10 ? '; you and allies are immune to frightened (Aura of Courage)' : ''}.</span>
          </div>
        )}
        {level >= 3 && (
          <div className="dnd-warmagic__reminder">
            <Shield size={12} />
            <span><strong>Oath</strong> — your sacred oath grants Channel Divinity options and aura features (see below &amp; the Features tab).</span>
          </div>
        )}
      </div>
    </div>
  );
}
