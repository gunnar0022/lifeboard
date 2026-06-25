import { Waves, Shield, Anchor, Sparkles } from 'lucide-react';
import { abilityMod, proficiencyBonus, formatMod } from '../../dndUtils';
import { OnceToggle } from './trackers';

/**
 * The Fathomless — Combat tab. The Tentacle of the Deeps is the signature: a
 * summonable spectral tentacle (PB uses / long rest) with a live attack line and
 * a summoned/dismissed state, folding in Guardian Coil's damage reduction once it
 * is on the field. Grasping Tentacles grants a free Evard's cast (+ temp HP), and
 * Fathomless Plunge is a rest-limited teleport. State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-warlock)';

export default function FathomlessBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const atk = pb + chaMod;
  const big = level >= 10;                       // tentacle & coil scale up at 10th
  const die = big ? '2d8' : '1d8';

  const used = cf.tentacleUses || 0;
  const remaining = Math.max(0, pb - used);
  const active = !!cf.tentacleActive;

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });
  const summon = () => { if (remaining > 0) patch({ tentacleUses: used + 1, tentacleActive: true }); };
  const dismiss = () => patch({ tentacleActive: false });
  const restoreUse = () => patch({ tentacleUses: Math.max(0, used - 1) });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Tentacle of the Deeps — signature summon */}
      <div className={`dnd-sig ${active ? 'dnd-sig--locked' : ''}`} style={{ '--block-accent': ACCENT }}>
        <div className="dnd-sig__token"><Waves size={20} /></div>
        <div className="dnd-sig__body">
          <div className="dnd-sig__title">
            <Waves size={13} /> Tentacle of the Deeps
            <span className="dnd-warmagic__uses" style={{ marginLeft: 'auto' }}>{remaining}/{pb} uses</span>
          </div>
          <span className="dnd-sig__desc">
            {active
              ? <><strong>On the field</strong> (10 ft, lasts 1 min). Bonus action: move it 30 ft and repeat the strike.</>
              : <>Bonus action: summon a 10-ft tentacle within 60 ft and strike a creature within 10 ft of it.</>}
          </span>
          <div className="dnd-companion__action" style={{ borderLeftColor: ACCENT }}>
            <div className="dnd-companion__action-head">
              <span className="dnd-companion__action-name">Spectral Strike</span>
              <span className="dnd-companion__hit">{formatMod(atk)} to hit</span>
            </div>
            <p className="dnd-companion__damage">{die} cold · speed −10 ft until your next turn</p>
          </div>
          <div className="dnd-warmagic__btns">
            {active
              ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={dismiss}>Dismiss</button>
              : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={summon} disabled={remaining <= 0}>Summon &amp; Strike</button>}
            <button className="dnd-warmagic__btn" onClick={restoreUse} disabled={used <= 0} title="Restore a use">+</button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Anchor size={12} />
          <span><strong>Gift of the Sea</strong> — swim speed 40 ft and breathe underwater{level >= 6 ? '; resistance to cold damage (Oceanic Soul).' : '.'}</span>
        </div>
        {level >= 6 && (
          <div className={`dnd-warmagic__reminder ${active ? 'dnd-warmagic__reminder--active' : ''}`}>
            <Shield size={12} />
            <span><strong>Guardian Coil</strong> — while a creature is within 10 ft of the tentacle, reaction to reduce damage to it by <strong>{die}</strong>.{active ? '' : ' (Summon the tentacle to use.)'}</span>
          </div>
        )}
      </div>

      {/* Grasping Tentacles — free Evard's cast */}
      {level >= 10 && (
        <OnceToggle
          icon={<Sparkles size={13} />} title="Grasping Tentacles" rest="long rest"
          used={!!cf.graspingUsed}
          note={<>Free cast of <strong>Evard's Black Tentacles</strong> (no slot). On cast: gain <strong>{level}</strong> temp HP, and damage can't break your concentration on it.</>}
          onToggle={() => {
            const next = !cf.graspingUsed;
            // Spending the free cast grants warlock-level temp HP.
            onUpdate({ classFeature: { ...cf, graspingUsed: next, ...(next ? { _grantTempHp: level } : {}) } });
          }}
        />
      )}

      {/* Fathomless Plunge — teleport to water */}
      {level >= 14 && (
        <OnceToggle
          icon={<Waves size={13} />} title="Fathomless Plunge" rest="short or long rest"
          used={!!cf.fathomlessPlungeUsed}
          note="Action: teleport you and up to five willing creatures within 30 ft to a body of water up to 1 mile away."
          onToggle={() => onUpdate({ classFeature: { ...cf, fathomlessPlungeUsed: !cf.fathomlessPlungeUsed } })}
        />
      )}
    </div>
  );
}
