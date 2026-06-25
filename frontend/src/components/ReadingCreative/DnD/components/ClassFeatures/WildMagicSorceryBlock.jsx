import { Dices, Sparkles, Shuffle, Zap, Bomb } from 'lucide-react';
import { OnceToggle } from './trackers';
import { wildMagicSurge, rollD100 } from '../../rules/shared/wildMagicSurge';

/**
 * Wild Magic — Combat tab. The centerpiece is the Wild Magic Surge box: type a
 * d100 roll (or hit Roll) and it resolves the table effect; at 14th level
 * (Controlled Chaos) Roll produces two results and you use either. Tides of Chaos
 * is a once-per-long-rest advantage, and Bend Luck spends 2 SP for a reaction
 * 1d4. Sorcery points live on the base Sorcerer card. State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-sorcerer)';

function SurgeResult({ roll }) {
  const effect = wildMagicSurge(roll);
  if (!effect) return null;
  return (
    <div className="dnd-chaos__result">
      <span className="dnd-chaos__roll">{roll === 100 ? '00' : String(roll).padStart(2, '0')}</span>
      <p className="dnd-chaos__effect">{effect}</p>
    </div>
  );
}

export default function WildMagicSorceryBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const sp = cf.currentPoints ?? 0;
  const controlled = level >= 14;
  const surge = cf.surge || { a: null, b: null };

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });
  const setSurge = (a, b = null) => patch({ surge: { a, b } });
  const roll = () => setSurge(rollD100(), controlled ? rollD100() : null);
  const setManual = (v) => {
    const n = parseInt(v, 10);
    if (v === '') return setSurge(null, null);
    if (!Number.isNaN(n)) setSurge(Math.max(1, Math.min(100, n)), null);
  };
  const spend = (n) => { if (sp >= n) patch({ currentPoints: sp - n }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Wild Magic Surge — the chaos box */}
      <div className="dnd-chaos">
        <div className="dnd-chaos__head">
          <span className="dnd-chaos__title"><Dices size={14} /> Wild Magic Surge</span>
          {controlled && <span className="dnd-chaos__tag"><Shuffle size={11} /> Controlled Chaos</span>}
        </div>
        <p className="dnd-chaos__hint">After a 1 on the d20, roll d100 (or enter the DM's roll):</p>
        <div className="dnd-chaos__controls">
          <input
            type="number" min="1" max="100" className="dnd-field dnd-chaos__input"
            value={surge.a ?? ''} placeholder="1–100" onChange={e => setManual(e.target.value)}
          />
          <button className="dnd-chaos__roll-btn" onClick={roll}>
            <Dices size={14} /> {controlled ? 'Roll ×2' : 'Roll'}
          </button>
        </div>
        {surge.a != null && <SurgeResult roll={surge.a} />}
        {controlled && surge.b != null && (
          <>
            <div className="dnd-chaos__or">— or —</div>
            <SurgeResult roll={surge.b} />
            <p className="dnd-chaos__hint">Controlled Chaos: use either result.</p>
          </>
        )}
      </div>

      {/* Tides of Chaos */}
      <OnceToggle
        icon={<Sparkles size={13} />} title="Tides of Chaos" rest="long rest"
        used={!!cf.tidesUsed}
        note="Gain advantage on one attack, check, or save. Recharges on a long rest — or immediately when the DM has you roll a surge after casting."
        onToggle={() => patch({ tidesUsed: !cf.tidesUsed })}
      />

      {/* Bend Luck */}
      {level >= 6 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Zap size={13} /> Bend Luck</h4>
            <span className="dnd-warmagic__uses">2 SP</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Reaction when a creature you can see makes an attack/check/save: roll <strong>1d4</strong> and add or subtract it (your choice).</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spend(2)} disabled={sp < 2}>−2 SP</button>
            </div>
          </div>
        </div>
      )}

      {/* Spell Bombardment */}
      {level >= 18 && (
        <div className="dnd-warmagic__reminders">
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Bomb size={12} />
            <span><strong>Spell Bombardment</strong> — when a spell's damage die rolls its max, roll one such die again and add it. Once per turn.</span>
          </div>
        </div>
      )}
    </div>
  );
}
