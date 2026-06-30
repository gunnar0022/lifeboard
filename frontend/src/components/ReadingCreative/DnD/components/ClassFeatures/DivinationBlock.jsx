import { useEffect } from 'react';
import { Eye, Sparkles, Dice6, ScrollText, Moon, Ghost, Languages, ScanEye } from 'lucide-react';

const d20 = () => Math.floor(Math.random() * 20) + 1;

const THIRD_EYE = [
  { key: 'darkvision', label: 'Darkvision', icon: Moon, note: 'Darkvision out to 60 ft.' },
  { key: 'ethereal', label: 'Ethereal Sight', icon: Ghost, note: 'See into the Ethereal Plane within 60 ft.' },
  { key: 'comprehension', label: 'Greater Comprehension', icon: Languages, note: 'Read any language.' },
  { key: 'invisibility', label: 'See Invisibility', icon: ScanEye, note: 'See invisible creatures/objects within 10 ft.' },
];

/**
 * School of Divination — Combat tab. The Portent dice are the heart: two (or
 * three at 14th) foretold d20s rolled at dawn, each spent once to overwrite a
 * roll you can see. Roll/reroll them here, tap to spend. The Third Eye offers a
 * pick-one perception boon; Expert Divination rides along as a reminder.
 */
export default function DivinationBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const count = level >= 14 ? 3 : 2;

  const rolls = cf.portent?.rolls || [];
  const thirdEye = cf.thirdEye || { benefit: null, used: false };

  // Keep the foretelling pool sized to the Portent count (2, or 3 at 14th).
  // New slots start blank so you can type your tabletop d20 result.
  useEffect(() => {
    if (rolls.length !== count) {
      const next = Array.from({ length: count }, (_, i) => rolls[i] || { v: null, used: false });
      onUpdate({ classFeature: { ...cf, portent: { rolls: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const setRolls = (next) => onUpdate({ classFeature: { ...cf, portent: { rolls: next } } });
  const setVal = (i, raw) => {
    let v = parseInt(raw, 10);
    if (Number.isNaN(v)) v = null;
    else v = Math.max(1, Math.min(20, v));
    setRolls(rolls.map((r, j) => j === i ? { v, used: false } : r));
  };
  const spend = (i) => { if (rolls[i]?.v) setRolls(rolls.map((r, j) => j === i ? { ...r, used: true } : r)); };
  const reroll = (i) => setRolls(rolls.map((r, j) => j === i ? { v: d20(), used: false } : r));
  const clearAll = () => setRolls(Array.from({ length: count }, () => ({ v: null, used: false })));

  const setEye = (benefit) => onUpdate({ classFeature: { ...cf, thirdEye: { benefit, used: true } } });
  const clearEye = () => onUpdate({ classFeature: { ...cf, thirdEye: { benefit: null, used: false } } });

  const hasExpert = level >= 6;
  const hasThirdEye = level >= 10;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-wizard)' }}>
      {/* Portent — foretelling dice */}
      <div className="dnd-portent">
        <div className="dnd-portent__head">
          <h4 className="dnd-portent__title"><Sparkles size={14} /> Portent</h4>
          <button className="dnd-warmagic__btn" onClick={clearAll} title="Clear for fresh foretellings (long rest)">Clear</button>
        </div>
        <div className="dnd-portent__dice">
          {rolls.map((r, i) => (
            <div key={i} className={`dnd-portent__die ${r.used ? 'dnd-portent__die--used' : ''}`}>
              <input
                className="dnd-portent__input" type="number" min="1" max="20"
                placeholder="–" value={r.v ?? ''} disabled={r.used}
                onChange={(e) => setVal(i, e.target.value)}
                title="Type your tabletop d20 result"
              />
              <div className="dnd-portent__ctrls">
                <button className="dnd-portent__use" onClick={() => spend(i)} disabled={r.used || !r.v}>
                  {r.used ? 'Spent' : 'Use'}
                </button>
                <button className="dnd-portent__roll" onClick={() => reroll(i)} title="Roll digitally (backup)">
                  <Dice6 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <span className="dnd-warmagic__note">Roll your real d20s at dawn and <strong>type each result</strong> above (the die button rolls digitally as a backup). Spend one to replace an attack, save, or check — chosen before the roll, once per turn. Lost on a long rest.</span>
      </div>

      {/* The Third Eye */}
      {hasThirdEye && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Eye size={13} /> The Third Eye</h4>
            <span className="dnd-warmagic__uses">{thirdEye.used ? 'spent' : 'ready'}</span>
          </div>
          {thirdEye.benefit ? (
            <div className="dnd-warmagic__row">
              <span className="dnd-warmagic__note">
                <strong>{THIRD_EYE.find(e => e.key === thirdEye.benefit)?.label}</strong> active until a short/long rest.
              </span>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={clearEye}>End</button>
            </div>
          ) : (
            <div className="dnd-thirdeye__opts">
              {THIRD_EYE.map(({ key, label, icon: Icon, note }) => (
                <button key={key} className="dnd-thirdeye__opt" onClick={() => setEye(key)} title={note}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        {hasExpert && (
          <div className="dnd-warmagic__reminder">
            <ScrollText size={12} />
            <span><strong>Expert Divination</strong> — casting a divination spell (2nd+) regains one expended slot of a lower level (max 5th).</span>
          </div>
        )}
      </div>
    </div>
  );
}
